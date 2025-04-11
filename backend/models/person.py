from pydantic import BaseModel
from typing import List, Optional


class PersonBase(BaseModel):
    uid: str
    name: str
    owns: List[str] = []  # list of Entity uids
    address: List[str] = []  # Address
    bankAccounts: List[str] = []  # BankAccount uids
    attachmentFiles: Optional[List[str]] = []  # Attachment file urls


class PersonRead(PersonBase):
    pass


class PersonCreate(PersonBase):
    """PersonCreate is used for creating a new person."""

    uid: Optional[str] = None


class PersonUpdate(PersonBase):
    name: Optional[str] = None
    owns: Optional[List[str]] = None  # list of Entity uids
    address: Optional[List[str]] = None  # Address
    bankAccounts: Optional[List[str]] = None  # BankAccount uids
    attachmentFiles: Optional[List[str]] = None  # Attachment file urls
