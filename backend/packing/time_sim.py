import csv
import io
from datetime import datetime, timedelta
from .packing import Item, Container, pack_items, parse_items, parse_containers

TOL = 1e-6

# ----------------------------
# Time Simulation
# ----------------------------
def simulate_day(numOfDays=None, toTimestamp=None, itemsToBeUsedPerDay=[], containers=[]):
  """
  Simulate time passing.
  Either numOfDays (int) or toTimestamp (ISO string) must be provided.
  itemsToBeUsedPerDay: list of dicts with keys "itemId" or "name".
  
  For each day:
    - Decrement usage for used items.
    - Mark items as expired if the new date exceeds their expiry.
    - Collect items that are depleted (usage_limit becomes 0).
    
  Returns a dict:
    {
      "success": boolean,
      "newDate": ISO string,
      "changes": {
         "itemsUsed": [{ "itemId": ..., "name": ..., "remainingUses": ... }],
         "itemsExpired": [{ "itemId": ..., "name": ... }],
         "itemsDepletedToday": [{ "itemId": ..., "name": ... }]
      }
    }
  """
  # Determine current simulated date (for our simulation, assume today)
  current_date = datetime.now()
  if numOfDays is not None:
    delta = timedelta(days=numOfDays)
    new_date = current_date + delta
  elif toTimestamp:
    new_date = datetime.fromisoformat(toTimestamp)
  else:
    return {"success": False, "message": "Provide numOfDays or toTimestamp."}
  
  itemsUsed = []
  itemsExpired = []
  itemsDepletedToday = []
  
  # Build a lookup for items to be used by id and name
  used_lookup = {}
  for entry in itemsToBeUsedPerDay:
    key = entry.get("itemId") or entry.get("name")
    if key:
      used_lookup[key] = entry
  
  # For each container, update items.
  for container in containers:
    for i, (item, pos, orient) in enumerate(container.placements):
      # Decrement usage if the item is scheduled for use.
      key = item.id
      if key in used_lookup or item.name in used_lookup:
        if item.usage_limit > 0:
          item.usage_limit -= 1
          itemsUsed.append({
            "itemId": item.id,
            "name": item.name,
            "remainingUses": item.usage_limit
          })
          if item.usage_limit == 0:
            itemsDepletedToday.append({
              "itemId": item.id,
              "name": item.name
            })
      # Check expiry (if expiry is set)
      if item.expiry and new_date > item.expiry:
        itemsExpired.append({
          "itemId": item.id,
          "name": item.name
        })
  
  return {
    "success": True,
    "newDate": new_date.isoformat(),
    "changes": {
      "itemsUsed": itemsUsed,
      "itemsExpired": itemsExpired,
      "itemsDepletedToday": itemsDepletedToday
    }
  }


# ----------------------------
# Example Usage
# ----------------------------
if __name__ == "__main__":
  # Sample CSV data for items and containers
  item_csv = """
item_id,name,width_cm,depth_cm,height_cm,mass_kg,priority,expiry_date,usage_limit,preferred_zone
000001,Research_Samples,26.8,17.5,19.4,2.4,84,2023-01-01,0,Storage_Bay
000002,LED_Work_Light,49.9,36.3,44.2,40.03,90,N/A,3558,Maintenance_Bay
000003,Pressure_Regulator,48.1,33.2,43.1,34.41,16,2024-01-01,1075,Airlock
000004,Namkin,48.1,33.2,43.1,34.41,6,N/A,1075,Airlock
  """
  container_csv = """
zone,container_id,width_cm,depth_cm,height_cm
Command_Center,CC02,1000.0,170.0,200.0
  """
  
  containers = parse_containers(container_csv)
  items = parse_items(item_csv)

  # Simulate time passing
  sim_result = simulate_day(numOfDays=5, itemsToBeUsedPerDay=[{"itemId": "000003"}], containers=containers)
  print("Time Simulation Result:")
  print(sim_result)
