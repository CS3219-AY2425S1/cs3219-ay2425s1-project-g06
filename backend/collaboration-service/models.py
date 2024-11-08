import logging

class User:
    users: dict[str, "User"] = {}

    def __init__(self, user_id, username: str, sid: str):
        self.user_id = user_id
        self.username = username
        self.cursor_position = 0
        self.sid = sid
        self.room: "Room" = None
        User.users[sid] = self

    def join_room(self, room: "Room") -> None:
        self.room = room

    def update_cursor_position(self, position: int) -> None:
        self.cursor_position = position

    def details(self) -> dict:
        return {
            'username': self.username,
            'cursor_position': self.cursor_position,
        }

    def __eq__(self, other) -> bool:
        if not isinstance(other, User):
            return False
        return self.username == other.username

    def __repr__(self) -> str:
        return f'User(username={self.username}, cursor_position={self.cursor_position})'

    def __str__(self) -> str:
        return self.__repr__()

    @classmethod
    def remove_user(cls, user: "User") -> None:
        del cls.users[user.sid]


class Room:
    rooms: dict[str, "Room"] = {}

    def __init__(self, room_id: str, user: User):
        self.id = room_id
        self.users: list[User] = [user]
        self.code = ""
        Room.rooms[room_id] = self
        user.join_room(self)

    def add_user(self, user: User) -> None:
        if user not in self.users:
            self.users.append(user)
            user.join_room(self)
        else:
            logging.warning(f"User {user.sid} is already in room {self.id}")

    def remove_user(self, user: User) -> bool:
        if user in self.users:
            self.users.remove(user)
            User.remove_user(user)
            if len(self.users) == 0:
                del Room.rooms[self.id]
                logging.info(f"Room {self.id} deleted as it became empty")
                return False
            else:
                logging.info(f"User {user.sid} removed from room {self.id}")
                return True
        else:
            logging.error(f"Attempted to remove user {user.sid} who is not in room {self.id}")
            return True

    def update_code(self, code: str) -> None:
        self.code = code

    def details(self) -> dict:
        return {
            'id': self.id,
            'users': [user.details() for user in self.users],
            'code': self.code,
        }

    def __eq__(self, other) -> bool:
        if not isinstance(other, Room):
            return False
        return self.id == other.id

    def __repr__(self) -> str:
        return f'Room(id={self.id}, users={self.users}, code={self.code})'

    def __str__(self) -> str:
        return self.__repr__()

    @classmethod
    def get_or_create(cls, room_id: str, user: User) -> "Room":
        if room_id in cls.rooms:
            room = cls.rooms[room_id]
            room.add_user(user)
            return room
        else:
            return cls(room_id, user)
