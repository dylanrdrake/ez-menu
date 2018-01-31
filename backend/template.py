from db import query_db

# Get template
def gettemplate(tempid):
    temp_query = """
    SELECT * FROM templates
    WHERE TemplateId=%s
    """
    value_params = [tempid]
    tempdata = query_db(temp_query, value_params, False)[0]

    return tempdata
