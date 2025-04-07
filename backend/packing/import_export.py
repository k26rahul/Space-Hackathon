import csv
import io
from datetime import datetime
from .packing import Item, Container

TOL = 1e-6

# ----------------------------
# Import Items Function
# ----------------------------
def import_items(csv_data):
  """
  Import items from a CSV file (provided as a string).
  Returns a dict with:
    - success: boolean
    - itemsImported: number
    - errors: list of dicts { "row": number, "message": "string" }
    - items: list of imported Item objects
  """
  errors = []
  items_list = []
  reader = csv.DictReader(io.StringIO(csv_data.strip()))
  row_num = 1
  for row in reader:
    try:
      expiry = row["expiry_date"].strip()
      expiry_date = None if expiry == "N/A" else datetime.strptime(expiry, "%Y-%m-%d")
      usage_limit = int(row["usage_limit"]) if row["usage_limit"].strip() != "N/A" else float('inf')
      item = Item(
        item_id=row["item_id"].strip(),
        name=row["name"].strip(),
        width=float(row["width_cm"].strip()),
        depth=float(row["depth_cm"].strip()),
        height=float(row["height_cm"].strip()),
        mass_kg=float(row["mass_kg"].strip()),
        priority=int(row["priority"].strip()),
        expiry=expiry_date,
        usage_limit=usage_limit,
        preferred_zone=row["preferred_zone"].strip()
      )
      items_list.append(item)
    except Exception as e:
      errors.append({"row": row_num, "message": str(e)})
    row_num += 1
  return {"success": True, "itemsImported": len(items_list), "errors": errors, "items": items_list}

# ----------------------------
# Import Containers Function
# ----------------------------
def import_containers(csv_data):
  """
  Import containers from a CSV file (given as a string).
  Returns a dict with:
    - success: boolean
    - containersImported: number
    - errors: list of dicts { "row": number, "message": "string" }
    - containers: list of imported Container objects
  """
  import csv, io
  errors = []
  containers_list = []
  reader = csv.DictReader(io.StringIO(csv_data.strip()))
  row_num = 1
  for row in reader:
    try:
      container = Container(
        container_id=row["container_id"].strip(),
        zone=row["zone"].strip(),
        width=float(row["width_cm"].strip()),
        depth=float(row["depth_cm"].strip()),
        height=float(row["height_cm"].strip())
      )
      containers_list.append(container)
    except Exception as e:
      errors.append({"row": row_num, "message": str(e)})
    row_num += 1
  return {
    "success": True,
    "containersImported": len(containers_list),
    "errors": errors,
    "containers": containers_list
  }

# ----------------------------
# Export Arrangement Function
# ----------------------------
def export_arrangement(containers):
  """
  Export the current arrangement as CSV.
  Format: Item ID, Container ID, Coordinates (W1,D1,H1), (W2,D2,H2)
  Returns a CSV string.
  """
  output = io.StringIO()
  writer = csv.writer(output)
  writer.writerow(["Item ID", "Container ID", "Coordinates (W1,D1,H1)", "Coordinates (W2,D2,H2)"])
  for container in containers:
    for item, pos, orient in container.placements:
      start_coords = f"({pos[0]:.2f},{pos[1]:.2f},{pos[2]:.2f})"
      # End coordinates: start plus placed orientation dimensions.
      end_coords = f"({pos[0] + orient[0]:.2f},{pos[1] + orient[2]:.2f},{pos[2] + orient[1]:.2f})"
      writer.writerow([item.id, container.id, start_coords, end_coords])
  return output.getvalue()

# ----------------------------
# For debugging: Custom __repr__ for Container
# ----------------------------
def container_repr(container):
  return f"Container({container.id}, Zone: {container.zone}, {container.width}x{container.height}x{container.depth})"

# ----------------------------
# Example Execution
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
  
  items_import = import_items(item_csv)
  containers_import = import_containers(container_csv)
  
  print("Items Imported:", items_import)
  print("Containers Imported:", containers_import)
  print("\n Containers details:", { "containersImported": containers_import["containersImported"],
    "containers": [container_repr(c) for c in containers_import["containers"]] })
  
  # If packing has been performed (i.e. container.placements populated),
  # export the arrangement. Otherwise, this will print an empty CSV.
  arrangement_csv = export_arrangement(containers_import["containers"])
  print("\nExported Arrangement CSV:")
  print(arrangement_csv)
