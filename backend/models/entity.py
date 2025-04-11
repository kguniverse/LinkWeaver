from pydantic import BaseModel
from typing import List, Optional


class EntityBase(BaseModel):
    uid: str
    name: str
    ownedBy: List[str]  ## list of Person uids
    bankAccounts: List[str]  ## list of BankAccount uids
    address: str  # Address
    attachmentFiles: Optional[List[str]] = None  # list of Attachment file urls


class EntityRead(EntityBase):
    pass


class EntityCreate(EntityBase):
    """EntityCreate is used for creating a new entity."""

    uid: Optional[str] = None


class EntityUpdate(EntityBase):
    name: Optional[str] = None
    ownedBy: Optional[List[str]] = None  # list of Person uids
    bankAccounts: Optional[List[str]] = None  # list of BankAccount uids
    address: Optional[str] = None  # Address
    attachmentFiles: Optional[List[str]] = None  # list of Attachment file urls
