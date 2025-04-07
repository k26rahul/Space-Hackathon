from datetime import datetime
from .packing import Container, Item

TOL = 1e-6

# ----------------------------
# Identify Waste Items
# ----------------------------
def identify_waste(containers):
  """
  Identify waste items from all containers.
  An item is considered waste if its expiry date is past the current date 
  or its usage_limit is 0 (fully used).
  Returns a dict with 'success' and list of 'wasteItems'.
  """
  waste_items = []
  now = datetime.now()
  for container in containers:
    for item, pos, orient in container.placements:
      reason = None
      if item.expiry is not None and item.expiry < now:
        reason = "Expired"
      elif item.usage_limit <= 0:
        reason = "Out of Uses"
      if reason:
        waste_items.append({
          "itemId": item.id,
          "name": item.name,
          "reason": reason,
          "containerId": container.id,
          "position": {
            "startCoordinates": {
              "width": pos[0],
              "depth": pos[1],
              "height": pos[2]
            },
            "endCoordinates": {
              "width": pos[0] + orient[0],
              "depth": pos[1] + orient[1],
              "height": pos[2] + orient[2]
            }
          }
        })
  return {"success": True, "wasteItems": waste_items}

# ----------------------------
# Generate Waste Return Plan
# ----------------------------
def waste_return_plan(undockingContainerId, undockingDate, maxWeight, containers):
  """
  Generate a plan for moving waste items for undocking.
  - Collects all waste items.
  - Suggests moves from their current container to the undocking container.
  - Respects the maxWeight constraint.
  Returns a dict with success flag, returnPlan (list of steps),
  retrievalSteps (if needed), and a returnManifest.
  """
  waste_result = identify_waste(containers)
  waste_items = waste_result.get("wasteItems", [])
  
  # Calculate total weight of waste items
  total_weight = sum(
    next((item.mass_kg for container in containers for item, _, _ in container.placements if item.id == waste["itemId"]), 0)
    for waste in waste_items
  )
  
  # If waste exceeds maxWeight, plan to move as many as possible
  planned_items = []
  cumulative_weight = 0.0
  return_plan_steps = []
  step = 1
  
  for waste in waste_items:
    # Try to add the waste item if within weight limit
    item_weight = next((item.mass_kg for container in containers for item, _, _ in container.placements if item.id == waste["itemId"]), 0)
    if cumulative_weight + item_weight <= maxWeight:
      cumulative_weight += item_weight
      planned_items.append(waste)
      return_plan_steps.append({
        "step": step,
        "itemId": waste["itemId"],
        "itemName": waste["name"],
        "fromContainer": waste["containerId"],
        "toContainer": undockingContainerId
      })
      step += 1
  
  # For simplicity, assume retrievalSteps are needed for each waste item
  retrieval_steps = []
  for plan in return_plan_steps:
    retrieval_steps.append({
      "step": plan["step"],
      "action": "retrieve",
      "itemId": plan["itemId"],
      "itemName": plan["itemName"]
    })
  
  # Build the return manifest
  return_manifest = {
    "undockingContainerId": undockingContainerId,
    "undockingDate": undockingDate,
    "returnItems": [{"itemId": w["itemId"], "name": w["name"], "reason": w["reason"]} for w in planned_items],
    "totalVolume": 0,
    "totalWeight": round(cumulative_weight, 2)
  }
  
  return {
    "success": True,
    "returnPlan": return_plan_steps,
    "retrievalSteps": retrieval_steps,
    "returnManifest": return_manifest
  }

# ----------------------------
# Complete Undocking
# ----------------------------
def complete_undocking(undockingContainerId, timestamp, containers):
  """
  Complete the undocking process by removing waste items from containers.
  Returns a dict with success flag and number of items removed.
  """
  removed_count = 0
  for container in containers:
    # Remove items marked as waste (expired or out of uses)
    remaining = []
    for item, pos, orient in container.placements:
      now = datetime.now()
      if (item.expiry is not None and item.expiry < now) or (item.usage_limit <= 0):
        removed_count += 1
      else:
        remaining.append((item, pos, orient))
    container.placements = remaining
  return {"success": True, "itemsRemoved": removed_count}

# ----------------------------
# Example Usage
# ----------------------------
if __name__ == "__main__":
  from .packing import parse_items, parse_containers, pack_items
    
  item_data = """
item_id,name,width_cm,depth_cm,height_cm,mass_kg,priority,expiry_date,usage_limit,preferred_zone
000001,Research_Samples,26.8,17.5,19.4,2.4,84,2023-01-01,0,Storage_Bay
000002,LED_Work_Light,49.9,36.3,44.2,40.03,90,N/A,3558,Maintenance_Bay
000003,Pressure_Regulator,48.1,33.2,43.1,34.41,16,2024-01-01,1075,Airlock
000004,Namkin,48.1,33.2,43.1,34.41,6,N/A,1075,Airlock
  """
  container_data = """
zone,container_id,width_cm,depth_cm,height_cm
Command_Center,CC02,100.0,170.0,200.0
  """
  
  items = parse_items(item_data)
  containers = parse_containers(container_data)
  pack_items(containers, items)
  
  # Identify waste items
  waste = identify_waste(containers)
  print("Waste Items:")
  print(waste)
  
  # Generate waste return plan (for undocking)
  plan = waste_return_plan("UC01", datetime.now().isoformat(), 100.0, containers)
  print("\nWaste Return Plan:")
  print(plan)
  
  # Complete undocking process
  complete = complete_undocking("UC01", datetime.now().isoformat(), containers)
  print("\nComplete Undocking:")
  print(complete)
