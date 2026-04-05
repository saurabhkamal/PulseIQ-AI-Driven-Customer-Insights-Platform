"""Generic base repository with common CRUD operations."""
from typing import Any, Generic, TypeVar

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, model: type[ModelT], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def get_by_id(self, id_: str) -> ModelT | None:
        result = await self.session.get(self.model, id_)
        return result

    async def list(
        self,
        *filters: Any,
        offset: int = 0,
        limit: int = 20,
        order_by: Any = None,
    ) -> tuple[list[ModelT], int]:
        count_q = select(func.count()).select_from(self.model)
        data_q = select(self.model)

        if filters:
            count_q = count_q.where(*filters)
            data_q = data_q.where(*filters)

        if order_by is not None:
            data_q = data_q.order_by(order_by)

        data_q = data_q.offset(offset).limit(limit)

        total = (await self.session.execute(count_q)).scalar_one()
        rows = (await self.session.execute(data_q)).scalars().all()
        return list(rows), total

    async def create(self, obj: ModelT) -> ModelT:
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def delete(self, obj: ModelT) -> None:
        await self.session.delete(obj)
        await self.session.flush()
