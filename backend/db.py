from main import g

# Returns lastrowid if commiting changes
# Returns results if querying data
def query_db(sql_query, params, commit):
    params = tuple(params)
    cursor = g.conn.cursor()
    cursor.execute(sql_query, params)
    raw_results = cursor.fetchall()
    column_data = cursor.description
    cursor.close()
    if commit:
        g.conn.commit()
        return cursor.lastrowid
    else:
        columns = [col[0] for col in column_data]
        results = [{col: data for col,data in zip(columns,result)}\
                for result in raw_results]
        return results
