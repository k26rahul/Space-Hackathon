import json
import csv
import time
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


def verify_packing_results(containers, placed, unplaced):
  total_container_volume = 0
  total_placed_volume = 0
  preferred_zone_count = 0
  non_preferred_zone_count = 0
  preferred_zone_priority_sum = 0
  non_preferred_zone_priority_sum = 0

  print("Size format: (width, height, depth)")
  print("Position format: (x, y, z)")

  for container in containers:
    container_volume = container.width * container.height * container.depth
    total_container_volume += container_volume
    items_volume = 0

    print(f"\nContainer {container.id}")
    print(f"Container position: ({container.width/2:.1f}, {0.0:.1f}, {0.0:.1f})")

    print("\nPacked items:")
    for item, (x, y, z), orient in container.placements:
      width, depth, height = orient
      if container.zone == item.preferred_zone:
        preferred_zone_count += 1
        preferred_zone_priority_sum += item.priority
      else:
        non_preferred_zone_count += 1
        non_preferred_zone_priority_sum += item.priority
      print(f"- {item.id}: position({x:.1f}, {y:.1f}, {z:.1f}), "
            f"size({width:.1f}, {height:.1f}, {depth:.1f}), "
            f"priority: {item.priority}")
      item_volume = width * depth * height
      items_volume += item_volume

    total_placed_volume += items_volume
    free_space = container_volume - items_volume

    print(f"\nVolume stats:")
    print(f"Container: {container_volume:.1f} cm³")
    print(f"Items: {items_volume:.1f} cm³ ({(items_volume/container_volume)*100:.1f}%)")
    print(f"Free: {free_space:.1f} cm³ ({(free_space/container_volume)*100:.1f}%)")

  print("\nTotal stats:")
  print(f"Containers: {len(containers)}")
  print(f"Items placed: {len(placed)}")
  print(f"  - In preferred zone: {preferred_zone_count} (Priority sum: {preferred_zone_priority_sum}, "
        f"avg: {preferred_zone_priority_sum/preferred_zone_count if preferred_zone_count else 0:.1f})")
  print(f"  - In non-preferred zone: {non_preferred_zone_count} (Priority sum: {non_preferred_zone_priority_sum}, "
        f"avg: {non_preferred_zone_priority_sum/non_preferred_zone_count if non_preferred_zone_count else 0:.1f})")
  unplaced_priority_sum = sum(item.priority for item in unplaced)
  print(f"Items unplaced: {len(unplaced)} (Priority sum: {unplaced_priority_sum}, "
        f"avg: {unplaced_priority_sum/len(unplaced) if unplaced else 0:.1f})")
  print(f"Container volume: {total_container_volume:.1f} cm³")
  print(f"Placed volume: {total_placed_volume:.1f} cm³ ({(total_placed_volume/total_container_volume)*100:.1f}%)")
  print(f"Free volume: {(total_container_volume-total_placed_volume):.1f} cm³ "
        f"({((total_container_volume-total_placed_volume)/total_container_volume)*100:.1f}%)")


def main():
  start_time = time.time()

  # File paths
  ITEMS_CSV_FILE = r'C:\k26rahul\Code\space-hackathon\samples-eda\samples\input_items.csv'
  CONTAINERS_CSV_FILE = r'C:\k26rahul\Code\space-hackathon\samples-eda\samples\containers.csv'
  INPUT_JSON_FILE = r'C:\k26rahul\Code\space-hackathon\3d-visualizer\data\65stairs.json'
  OUTPUT_JSON_FILE = r'C:\k26rahul\Code\space-hackathon\3d-visualizer\data\output.json'

  # Choose your input method:
  items, containers = parse_from_csvs(ITEMS_CSV_FILE, CONTAINERS_CSV_FILE)
  # items, containers = parse_from_json(INPUT_JSON_FILE)

  containers, placed, unplaced = pack_items(containers, items)
  verify_packing_results(containers, placed, unplaced)
  save_packing_results(containers, OUTPUT_JSON_FILE)

  end_time = time.time()
  print(f"\nTotal execution time: {end_time - start_time:.2f} seconds")


main()
