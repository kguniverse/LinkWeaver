from models.person import PersonCreate
from models.entity import EntityCreate
from models.bank_account import BankAccountCreate


model_registry = {
    "Person": PersonCreate,
    "Entity": EntityCreate,
    "BankAccount": BankAccountCreate,
}
