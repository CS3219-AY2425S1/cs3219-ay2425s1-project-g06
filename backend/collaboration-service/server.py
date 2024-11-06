import socketio
import logging
import os
import dotenv

dotenv.load_dotenv()

from events import Events
from models import Room, User
from user_verification import authenticate

logging.basicConfig(level=int(os.environ.get('LOG_LEVEL', logging.INFO)))

sio = socketio.AsyncServer(cors_allowed_origins='*', async_mode='asgi')
app = socketio.ASGIApp(sio)
unauthenticated_sids = set()


@sio.event
async def connect(sid, environ):
    logging.info(f'connect {sid=}')
    token = None
    for header in environ['asgi.scope']['headers']:
        if header[0].lower() == b'authorization':
            token = header[1].decode()  # Extract token
            logging.debug(f"connect {token=}")
            break
    if token:
        username = authenticate(token)
        if username:
            User(username, sid)
            logging.info(f"User {username} authenticated and connected with sid {sid}")
        else:
            unauthenticated_sids.add(sid)
            await sio.disconnect(sid)
            logging.warning(f"Authentication failed for token: {token}")
    else:
        unauthenticated_sids.add(sid)
        await sio.disconnect(sid)
        logging.warning(f"No authorization header provided, disconnecting sid {sid}")


@sio.on(Events.JOIN_REQUEST)
async def join_request(sid, data):
    logging.debug(f'join_request {sid=} {data=}')
    room_id = data.get('room_id')
    
    if not room_id:
        logging.error(f"Missing room_id in join_request from sid {sid}")
        return
    
    user: User = User.users.get(sid)
    
    if user is None:
        logging.error(f"User not found for sid {sid} during join_request")
        return
    
    await sio.enter_room(sid, room_id)
    room: Room = Room.get_or_create(room_id, user)
    
    if user.room is None:
        logging.error(f"After join_request, user.room is None for sid {sid}")
    else:
        logging.debug(f"User {sid} joined room {room.id}")
    
    await sio.emit(Events.JOIN_REQUEST, room.details(), room=room_id)


@sio.on(Events.CODE_UPDATED)
async def code_updated(sid, data):
    logging.debug(f'code_updated {sid=} {data=}')
    code = data.get('code')
    
    if code is None:
        logging.error(f"Missing code in code_updated from sid {sid}")
        return
    
    user: User = User.users.get(sid)
    
    if user is None:
        logging.error(f"User not found for sid {sid} during code_updated")
        return
    
    if user.room is None:
        logging.error(f"User {sid} is not associated with any room during code_updated")
        return
    
    user.room.update_code(code)
    
    try:
        await sio.emit(Events.CODE_UPDATED, code, room=user.room.id, skip_sid=sid)
        logging.debug(f"Emitted CODE_UPDATED to room {user.room.id}")
    except Exception as e:
        logging.error(f"Failed to emit CODE_UPDATED for user {sid}: {e}")


@sio.on(Events.CURSOR_UPDATED)
async def cursor_updated(sid, data):
    logging.debug(f'cursor_updated {sid=} {data=}')
    cursor_position = data.get('cursor_position')
    
    if cursor_position is None:
        logging.error(f"cursor_position missing in data from sid {sid}")
        return
    
    user: User = User.users.get(sid)
    
    if user is None:
        logging.error(f"User not found for sid {sid}")
        return
    
    if user.room is None:
        logging.error(f"User {sid} is not associated with any room")
        return
    
    user.update_cursor_position(cursor_position)
    
    try:
        await sio.emit(
            Events.CURSOR_UPDATED,
            {'sid': sid, 'cursor_position': cursor_position},
            room=user.room.id,
            inlcude_self=False
        )
        logging.debug(f"Emitted CURSOR_UPDATED to room {user.room.id}")
    except Exception as e:
        logging.error(f"Failed to emit CURSOR_UPDATED for user {sid}: {e}")


@sio.on(Events.LANGUAGE_CHANGE)
async def language_change(sid, data):
    logging.debug(f'language_change {sid=} {data=}')
    language = data.get('language')
    room_id = data.get('room_id')
    
    if language is None or room_id is None:
        logging.error(f"Missing language or room_id in language_change from sid {sid}")
        return
    
    if language not in ["python", "cpp", "javascript", "java"]:
        logging.warning(f"Unsupported language {language} received from sid {sid}")
        return
    
    try:
        await sio.emit(Events.LANGUAGE_CHANGE, language, room=room_id, skip_sid=sid)
        logging.debug(f"Emitted LANGUAGE_CHANGE to room {room_id}")
    except Exception as e:
        logging.error(f"Failed to emit LANGUAGE_CHANGE for user {sid}: {e}")


@sio.event
async def disconnect(sid):
    logging.info(f'disconnect {sid=}')
    
    if sid in unauthenticated_sids:
        unauthenticated_sids.remove(sid)
        return
    
    user: User = User.users.get(sid)
    
    if user is None:
        logging.error(f"User not found for sid {sid} during disconnect")
        return
    
    room: Room = user.room
    
    if room is None:
        logging.error(f"User {sid} has no room during disconnect")
        return
    
    room_still_exists = room.remove_user(user)
    
    if room_still_exists:
        try:
            await sio.emit(Events.USER_LEFT, user.details(), room=room.id)
            logging.debug(f"Emitted USER_LEFT to room {room.id}")
        except Exception as e:
            logging.error(f"Failed to emit USER_LEFT for room {room.id}: {e}")