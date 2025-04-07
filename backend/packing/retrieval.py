from datetime import datetime
from .packing import Container, Item  

TOL = 1e-6

def is_item_visible(item_pos, orient, container):
  x, y, z = item_pos
  w, d, h = orient
  # Open face is at z = container.depth; item is visible if its front face (z + d) is flush with container.depth.
  return abs((z + d) - container.depth) < TOL

def generate_retrieval_steps(target_item, container):
  steps = []
  target_placement = None
  for item, pos, orient in container.placements:
    if item.id == target_item.id:
      target_placement = (item, pos, orient)
      break
  if not target_placement:
    return steps
  item, pos, orient = target_placement
  if is_item_visible(pos, orient, container):
    steps.append({
      "step": 0,
      "action": "retrieve",
      "itemId": item.id,
      "itemName": item.name
    })
    return steps
  else:
    obstructors = []
    target_front = pos[2] + orient[1]
    for other_item, other_pos, other_orient in container.placements:
      if other_item.id != target_item.id:
        other_front = other_pos[2] + other_orient[1]
        if other_front > target_front + TOL:
          obstructors.append((other_item, other_pos))
    step_num = 1
    for obstruct_item, _ in obstructors:
      steps.append({
        "step": step_num,
        "action": "setAside",
        "itemId": obstruct_item.id,
        "itemName": obstruct_item.name
      })
      step_num += 1
    steps.append({
      "step": step_num,
      "action": "retrieve",
      "itemId": target_item.id,
      "itemName": target_item.name
    })
    step_num += 1
    for obstruct_item, _ in reversed(obstructors):
      steps.append({
        "step": step_num,
        "action": "placeBack",
        "itemId": obstruct_item.id,
        "itemName": obstruct_item.name
      })
      step_num += 1
    return steps

def search_item(item_id=None, item_name=None, containers=None):
  if not item_id and not item_name:
    return {"success": False, "found": False, "message": "Please provide itemId or itemName."}
  for container in containers:
    for placed_item, pos, orient in container.placements:
      if (item_id and placed_item.id == item_id) or (item_name and placed_item.name == item_name):
        retrieval_steps = generate_retrieval_steps(placed_item, container)
        return {
          "success": True,
          "found": True,
          "item": {
            "itemId": placed_item.id,
            "name": placed_item.name,
            "containerId": container.id,
            "zone": container.zone,
            "position": {
              "startCoordinates": {
                "width": pos[0],
                "depth": pos[2],
                "height": pos[1]
              },
              "endCoordinates": {
                "width": pos[0] + orient[0],
                "depth": pos[2] + orient[1],
                "height": pos[1] + orient[2]
              }
            }
          },
          "retrievalSteps": retrieval_steps
        }
  return {"success": True, "found": False, "message": "Item not found in containers."}

def retrieve_item(item_id, user_id, timestamp, containers):
  search_result = search_item(item_id=item_id, containers=containers)
  if not search_result.get("found"):
    return {"success": False, "message": "Item not found."}
  return {"success": True}

if __name__ == "__main__":
  from .packing import parse_items, parse_containers, pack_items
  
  item_data = """
item_id,name,width_cm,depth_cm,height_cm,mass_kg,priority,expiry_date,usage_limit,preferred_zone
000001,Research_Samples,100,80,100,2.4,84,N/A,2304,Storage_Bay
000002,LED_Work_Light,100,36.3,110,40.03,90,N/A,3558,Maintenance_Bay
  """
  
  container_data = """
zone,container_id,width_cm,depth_cm,height_cm
Command_Center,CC02,100.0,170.0,200.0
  """
  
  items = parse_items(item_data)
  containers = parse_containers(container_data)
  pack_items(containers, items)
  
  result1 = search_item(item_id="000002", containers=containers)
  result2 = search_item(item_id="000001", containers=containers)
  print("\nSearch API Result:")
  print(result1)
  print(result2)
  
  retrieval_result = retrieve_item(item_id="000003", user_id="user123", timestamp=datetime.now().isoformat(), containers=containers)
  print("\nRetrieval API Result:")
  print(retrieval_result)
