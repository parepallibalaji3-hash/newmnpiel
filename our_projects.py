def add_project(*args, **kwargs):
    return {"success": True}

def get_all_projects(*args, **kwargs):
    return {"success": True, "data": []}

def get_project_by_id(doc_id):
    return {"success": True, "data": {"id": doc_id}}

def update_project(doc_id, updates):
    return {"success": True}

def delete_project(doc_id):
    return {"success": True}