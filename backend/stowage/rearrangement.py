from copy import deepcopy
from datetime import datetime
from .packing import Container, Item, pack_items

# ----------------------------
# Utility Function: Check Fit
# ----------------------------


def can_fit_item(container, item):
  """Check if an item can fit in a container."""
  return any(fs.fits(orient) for fs in container.free_spaces for orient in get_orientations(item))


# ----------------------------
# Rearrangement Plan Generator
# ----------------------------
def suggest_rearrangement(containers, new_items):
  """
  Suggest a rearrangement plan if new items can't fit.
  Returns a dict with:
    - success: boolean
    - plan: list of dicts { "action": "remove/place/placeBack", "item_id": str, "container_id": str }
    - errors: list of dicts { "item_id": str, "message": str }
  """
  plan = []
  errors = []
  current_containers = deepcopy(containers)

  # Try packing without rearrangement first
  result = pack_items(current_containers, new_items)
  if not any(item for item in new_items if item not in [placement[0] for container in current_containers for placement in container.placements]):
    return {"success": True, "plan": plan, "errors": errors}

  # Perform rearrangement suggestions
  for item in new_items:
    target_containers = [c for c in current_containers if c.zone == item.preferred_zone]
    other_containers = [c for c in current_containers if c.zone != item.preferred_zone]
    containers_to_check = target_containers + other_containers

    item_placed = False
    for container in containers_to_check:
      if container.place_item(item):
        item_placed = True
        break

    if not item_placed:
      # Rearrangement is needed
      rearrangement_success = False

      for container in containers_to_check:
        removable_items = sorted(container.placements, key=lambda p: p[0].priority)  # Low priority first
        removable_items = [p[0] for p in removable_items]

        # Try removing items to make space
        temp_container = deepcopy(container)
        removed_items = []
        for candidate_item in removable_items:
          temp_container.placements = [(i, pos, orient)
                                       for (i, pos, orient) in temp_container.placements if i.id != candidate_item.id]
          temp_container.free_spaces = [FreeSpace(0, 0, 0, container.width, container.height, container.depth)]
          temp_container.merge_free_spaces()

          # Attempt to place the new item
          if temp_container.place_item(item):
            rearrangement_success = True
            # Record removal plan
            for removed_item in removed_items:
              plan.append({"action": "remove", "item_id": removed_item.id, "container_id": container.id})
            # Record placement plan
            plan.append({"action": "place", "item_id": item.id, "container_id": container.id})
            break
          else:
            removed_items.append(candidate_item)

        if rearrangement_success:
          # Place back removed items if possible
          for removed_item in removed_items:
            item_replaced = False
            for retry_container in containers_to_check:
              if retry_container.place_item(removed_item):
                plan.append({"action": "placeBack", "item_id": removed_item.id, "container_id": retry_container.id})
                item_replaced = True
                break
            if not item_replaced:
              errors.append({"item_id": removed_item.id, "message": "Could not reposition item."})
          break

      if not rearrangement_success:
        errors.append({"item_id": item.id, "message": "Insufficient space, even after rearrangement."})

  return {
      "success": len(errors) == 0,
      "plan": plan,
      "errors": errors
  }


# ----------------------------
# Example Execution
# ----------------------------
if __name__ == "__main__":
  from .import_export import import_items, import_containers

  item_csv = """
item_id,name,width_cm,depth_cm,height_cm,mass_kg,priority,expiry_date,usage_limit,preferred_zone
000005,New_Item,50.0,50.0,50.0,10.0,10,N/A,100,Command_Center
"""

  container_csv = """
zone,container_id,width_cm,depth_cm,height_cm
Command_Center,CC02,100.0,170.0,200.0
"""

  items_import = import_items(item_csv)
  containers_import = import_containers(container_csv)

  new_items = items_import["items"]
  containers = containers_import["containers"]

  rearrangement_result = suggest_rearrangement(containers, new_items)
  print("\nRearrangement Plan:")
  for step in rearrangement_result["plan"]:
    print(f"{step['action'].capitalize()} item {step['item_id']} in container {step['container_id']}")

  if rearrangement_result["errors"]:
    print("\nErrors:")
    for error in rearrangement_result["errors"]:
      print(f"Item {error['item_id']}: {error['message']}")
