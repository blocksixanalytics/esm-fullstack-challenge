import pandas as pd
from fastapi import APIRouter, Depends

from esm_fullstack_challenge.db import DB, query_builder
from esm_fullstack_challenge.dependencies import get_db, CommonQueryParams


dashboard_router = APIRouter()


@dashboard_router.get("/top_drivers_by_wins")
def get_top_drivers_by_wins(
    cqp: CommonQueryParams = Depends(CommonQueryParams),
    db: DB = Depends(get_db)
) -> list:
    """Gets top drivers by wins.

    Args:
        cqp (CommonQueryParams, optional): Common query params used for filtering.
                                           Defaults to Depends(CommonQueryParams).
        db (DB, optional): SQLite DB connection. Defaults to Depends(get_db).

    Returns:
        list: list of top drivers by wins.
    """
    base_query_str = (
        "with driver_wins as (\n"
        "    select d.id,\n"
        "        d.forename || ' ' || d.surname as full_name,\n"
        "        d.nationality,\n"
        "        d.dob,\n"
        "        date() - date(dob)             as age,\n"
        "        d.url\n"
        "    from drivers d\n"
        "          join results r on d.id = r.driver_id\n"
        "          join status s on r.status_id = s.id\n"
        "    where s.status = 'Finished'\n"
        "    and r.position_order = 1\n"
        ")\n"
        "select\n"
        "    *,\n"
        "    count(*) as number_of_wins\n"
        "from driver_wins"
    )
    query_str = query_builder(
        custom_select=base_query_str,
        order_by=cqp.order_by or [('number_of_wins', 'desc')],
        limit=cqp.limit,
        offset=cqp.offset,
        filter_by=cqp.filter_by,
        group_by=['id', 'full_name', 'nationality', 'dob', 'age', 'url']
    )
    with db.get_connection() as conn:
        df = pd.read_sql_query(query_str, conn)
        drivers = list(df.to_dict(orient='records'))

    return drivers



@dashboard_router.get("/top_teams_by_wins")
def get_top_teams_by_wins(
    cqp: CommonQueryParams = Depends(CommonQueryParams),
    db: DB = Depends(get_db)
) -> list:
    """Gets top teams by wins.

        Args:
            cqp (CommonQueryParams, optional): Common query params used for filtering.
                                               Defaults to Depends(CommonQueryParams).
            db (DB, optional): SQLite DB connection. Defaults to Depends(get_db).

        Returns:
            list: list of top drivers by wins.
        """
    query = (
        "SELECT c.name AS constructor_name, COUNT(*) AS number_of_wins "
        "FROM results r "
        "JOIN constructors c ON r.constructor_id = c.id "
        "JOIN status s ON r.status_id = s.id "
        "WHERE s.status = 'Finished' AND r.position_order = 1 "
        "GROUP BY c.name "
        "ORDER BY number_of_wins DESC "
        "LIMIT 10"
    )
    with db.get_connection() as conn:
        df = pd.read_sql_query(query, conn)
        return df.to_dict(orient="records")

@dashboard_router.get("/wins_over_time")
def get_wins_over_time(
    db: DB = Depends(get_db)
) -> list:
    """Gets a chart of wins over time

            Args:
                db (DB, optional): SQLite DB connection. Defaults to Depends(get_db).

            Returns:
                list: list of top drivers by wins.
            """
    query = (
        "SELECT r.year, d.forename || ' ' || d.surname AS driver_name, COUNT(*) AS wins "
        "FROM results r "
        "JOIN drivers d ON r.driver_id = d.id "
        "JOIN status s ON r.status_id = s.id "
        "WHERE s.status = 'Finished' AND r.position_order = 1 "
        "GROUP BY r.year, d.id "
        "ORDER BY r.year ASC, wins DESC"
    )
    with db.get_connection() as conn:
        df = pd.read_sql_query(query, conn)
        return df.to_dict(orient="records")
