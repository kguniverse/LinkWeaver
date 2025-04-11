from pydantic import BaseModel
from typing import Optional, List, Union


class BankAccountBase(BaseModel):
    uid: str
    account_numbers: str
    held_by: List[
        str
    ]  # list of Person uids or Entity uids Facets: {"begin_from": datetime}
    attachmentFiles: Optional[List[str]] = []  # list of Attachment file urls


class BankAccountRead(BankAccountBase):
    pass


class BankAccountCreate(BankAccountBase):
    """BankAccountCreate is used for creating a new bank account."""
    uid: Optional[str] = None


class BankAccountUpdate(BankAccountBase):
    account_number: Optional[str] = None
    held_by: Optional[List[str]] = None
    attachmentFiles: Optional[List[str]] = None  # list of Attachment file urls
