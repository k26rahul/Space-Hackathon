import json
import csv
from .Container import Container
from .Item import Item
from .packing import pack_items


def parse_from_csvs(items_csv_path, containers_csv_path):
  items = []
  containers = []

  # Parse items
  with open(items_csv_path) as f:
    reader = csv.DictReader(f)
    for row in reader:
      expiry_date = row['expiry_date']
      usage_limit = int(row['usage_limit']) if row['usage_limit'] != "N/A" else float("inf")
      items.append(Item(
          item_id=row['item_id'],
          name=row['name'],
          width=float(row['width_cm']),
          depth=float(row['depth_cm']),
          height=float(row['height_cm']),
          mass_kg=float(row['mass_kg']),
          priority=int(row['priority']),
          expiry=expiry_date,
          usage_limit=usage_limit,
          preferred_zone=row['preferred_zone']
      ))

  # Parse containers
  with open(containers_csv_path) as f:
    reader = csv.DictReader(f)
    for row in reader:
      containers.append(Container(
          container_id=row['container_id'],
          zone=row['zone'],
          width=float(row['width_cm']),
          depth=float(row['depth_cm']),
          height=float(row['height_cm'])
      ))

  return items, containers


def parse_from_json(json_path):
  with open(json_path) as f:
    data = json.load(f)

  items = []
  containers = []

  # Parse containers first
  for cont in data["containers"]:
    containers.append(Container(
        container_id=cont["id"],
        zone="Storage_Bay",  # Default zone
        width=cont["size"]["width"],
        depth=cont["size"]["depth"],
        height=cont["size"]["height"]
    ))

  # Parse items
  for idx, it in enumerate(data["items"]):
    items.append(Item(
        item_id=f"Item {idx + 1}",    # Generated ID
        name="Cargo_Item",            # Default name
        width=it["size"]["width"],
        depth=it["size"]["depth"],
        height=it["size"]["height"],
        mass_kg=2.0,                  # Default mass
        priority=50,                  # Default medium priority
        expiry="N/A",                 # Default no expiry
        usage_limit=float("inf"),     # Default unlimited usage
        preferred_zone="Storage_Bay"  # Default zone
    ))

  return items, containers


def save_packing_results(containers, output_file):
  result = {"items": [], "containers": []}

  total_width = 0  # Track cumulative width
  for container in containers:
    # Add container data
    container_data = {
        "id": container.id,
        "zone": container.zone,
        "size": {
            "width": container.width,
            "height": container.height,
            "depth": container.depth
        },
        "position": {"x": total_width, "y": 0, "z": 0}  # Place at current total_width
    }
    total_width += container.width  # Add this container's width for next container
    result["containers"].append(container_data)

    # Add items data for this container
    for item, (x, y, z), orient in container.placements:
      item_data = {
          "id": item.id,
          "name": item.name,
          "size": {
              "width": orient[0],
              "height": orient[2],
              "depth": orient[1]
          },
          "position": {
              "x": x,
              "y": y,
              "z": -z
          },
          "container_id": container.id
      }
      result["items"].append(item_data)

  with open(output_file, "w") as f:
    json.dump(result, f, indent=2)


def verify_packing_results(containers, unplaced):
  for container in containers:
    print(f"\n🔍 Container {container.id} (Zone: {container.zone})")
    print(f"Dimensions (W x H x D): {container.width:.2f} x {container.height:.2f} x {container.depth:.2f} cm")
    print(f"Total Mass: {container.total_mass():.2f} kg")
    print(f"Packed Items ({len(container.placements)}):")
    if container.placements:
      print(f"{'Item ID':<10}{'Name':<25}{'Dims (W x D x H)':<25}{'Pos (x, y, z)':<25}{'Priority':<10}{'Mass (kg)':<10}")
      print("-" * 110)
      for item, (x, y, z), orient in container.placements:
        dims = f"{orient[0]:.2f} x {orient[1]:.2f} x {orient[2]:.2f}"
        pos = f"({x:.2f}, {y:.2f}, {z:.2f})"
        print(f"{item.id:<10}{item.name:<25}{dims:<25}{pos:<25}{item.priority:<10}{item.mass_kg:<10.2f}")
    else:
      print("No items packed.")

    print("Free Spaces:")
    if container.free_spaces:
      for fs in container.free_spaces:
        src = fs.source if fs.source else "N/A"
        print(f"  {fs} - caused by {src}")
    else:
      print("  None")

  if unplaced:
    print("\n❌ Items that couldn't be placed:")
    for item in unplaced:
      print(f"  - {item.id} ({item.name}), Priority: {item.priority}")

  print("\n✅ Packing verification complete!\n")


# File paths
ITEMS_CSV_FILE = 'data/items.csv'
CONTAINERS_CSV_FILE = 'data/containers.csv'
INPUT_JSON_FILE = r'C:\k26rahul\Code\space-hackathon\3d-visualizer\data\8cube50.json'
OUTPUT_JSON_FILE = r'C:\k26rahul\Code\space-hackathon\3d-visualizer\data\output.json'

# Choose your input method:
# items, containers = parse_from_csvs(ITEMS_CSV_FILE, CONTAINERS_CSV_FILE)
items, containers = parse_from_json(INPUT_JSON_FILE)

containers, placed, unplaced = pack_items(containers, items)
verify_packing_results(containers, unplaced)
save_packing_results(containers, OUTPUT_JSON_FILE)
