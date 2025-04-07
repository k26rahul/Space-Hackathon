from datetime import datetime
from itertools import permutations
from dotenv import load_dotenv
import json

load_dotenv()

INPUT_DATA_FILE = r'C:\k26rahul\Code\space-hackathon\3d-visualizer\data\8cube50.json'
OUTPUT_DATA_FILE = r'C:\k26rahul\Code\space-hackathon\3d-visualizer\data\output.json'

# Tolerance for floating-point comparisons.
TOL = 1e-6

# ----------------------------
# Utility: Get all unique orientations for an item.
# ----------------------------


def get_orientations(item):
  dims = (item.width, item.depth, item.height)
  return {perm for perm in permutations(dims)}

# ----------------------------
# FreeSpace Class
# ----------------------------


class FreeSpace:
  def __init__(self, x, y, z, width, height, depth, source=None):
    self.x = x
    self.y = y
    self.z = z
    self.width = width
    self.height = height
    self.depth = depth
    self.source = source

  def fits(self, orient):
    w, d, h = orient
    return (w <= self.width + TOL and
            d <= self.depth + TOL and
            h <= self.height + TOL)

  def get_bounds(self):
    return (self.x, self.y, self.z, self.x + self.width, self.y + self.height, self.z + self.depth)

  def __repr__(self):
    src = f", source={self.source}" if self.source else ""
    return (f"FS(x={self.x:.2f}, y={self.y:.2f}, z={self.z:.2f}, "
            f"w={self.width:.2f}, h={self.height:.2f}, d={self.depth:.2f}{src})")

# ----------------------------
# Function to Trim a FreeSpace given a placed item's bounding box.
# This subtracts the overlapping volume and returns the remaining free subspaces.
# ----------------------------


def trim_free_space(fs, placed_bounds):
  fx1, fy1, fz1, fx2, fy2, fz2 = fs.get_bounds()
  px1, py1, pz1, px2, py2, pz2 = placed_bounds

  # Check for overlap. If there's no overlap, return the original fs.
  if (px2 <= fx1 + TOL or px1 >= fx2 - TOL or
      py2 <= fy1 + TOL or py1 >= fy2 - TOL or
          pz2 <= fz1 + TOL or pz1 >= fz2 - TOL):
    return [fs]

  new_spaces = []
  # Left section
  if px1 > fx1 + TOL:
    new_spaces.append(FreeSpace(fx1, fy1, fz1, px1 - fx1, fs.height, fs.depth, fs.source))
  # Right section
  if px2 < fx2 - TOL:
    new_spaces.append(FreeSpace(px2, fy1, fz1, fx2 - px2, fs.height, fs.depth, fs.source))
  # Bottom section (between left and right sections)
  if py1 > fy1 + TOL:
    new_spaces.append(FreeSpace(max(fx1, px1), fy1, fz1, min(fx2, px2) - max(fx1, px1), py1 - fy1, fs.depth, fs.source))
  # Top section
  if py2 < fy2 - TOL:
    new_spaces.append(FreeSpace(max(fx1, px1), py2, fz1, min(fx2, px2) - max(fx1, px1), fy2 - py2, fs.depth, fs.source))
  # Back section (in z dimension) within the intersected region in x,y
  if pz1 > fz1 + TOL:
    new_spaces.append(FreeSpace(max(fx1, px1), max(fy1, py1), fz1, min(fx2, px2) - max(fx1, px1),
                                min(fy2, py2) - max(fy1, py1), pz1 - fz1, fs.source))
  # Front section
  if pz2 < fz2 - TOL:
    new_spaces.append(FreeSpace(max(fx1, px1), max(fy1, py1), pz2, min(fx2, px2) - max(fx1, px1),
                                min(fy2, py2) - max(fy1, py1), fz2 - pz2, fs.source))

  # Filter out any free space with non-positive dimensions
  valid_spaces = [space for space in new_spaces if space.width > TOL and space.height > TOL and space.depth > TOL]
  return valid_spaces

# ----------------------------
# Container Class
# ----------------------------


class Container:
  def __init__(self, container_id, zone, width, depth, height):
    self.id = container_id
    self.zone = zone
    self.width = width
    self.depth = depth
    self.height = height
    self.placements = []  # List of tuples: (item, position, orientation)
    self.free_spaces = [FreeSpace(0, 0, 0, self.width, self.height, self.depth)]

  def __repr__(self):
    return f"Container({self.id}, Zone:{self.zone})"

  def total_mass(self):
    return sum(item.mass_kg for item, _, _ in self.placements)

  def add_placement(self, item, pos, orient):
    self.placements.append((item, pos, orient))

  def remove_free_space(self, fs):
    if fs in self.free_spaces:
      self.free_spaces.remove(fs)

  def update_free_spaces_with_trim(self, placed_item, pos, orient):
    # Determine bounding box of placed item
    px, py, pz = pos
    iw, id_, ih = orient
    placed_bounds = (px, py, pz, px + iw, py + ih, pz + id_)
    new_free_spaces = []
    # For each free space, trim out the region occupied by placed item.
    for fs in self.free_spaces:
      trimmed = trim_free_space(fs, placed_bounds)
      new_free_spaces.extend(trimmed)
    self.free_spaces = [fs for fs in new_free_spaces if fs.width > TOL and fs.height > TOL and fs.depth > TOL]
    self.merge_free_spaces()

  def merge_free_spaces(self):
    # A simple merge: check pairwise if two free spaces are adjacent and can be merged.
    merged = True
    while merged:
      merged = False
      new_spaces = []
      used = [False] * len(self.free_spaces)
      for i in range(len(self.free_spaces)):
        if used[i]:
          continue
        fs1 = self.free_spaces[i]
        for j in range(i+1, len(self.free_spaces)):
          if used[j]:
            continue
          fs2 = self.free_spaces[j]
          merged_box = try_merge(fs1, fs2)
          if merged_box:
            fs1 = merged_box
            used[j] = True
            merged = True
        new_spaces.append(fs1)
      self.free_spaces = new_spaces

  def place_item(self, item):
    # Sort free spaces: fill width first, then height, then depth.
    self.free_spaces.sort(key=lambda fs: (fs.z, fs.y, fs.x))
    valid_orientations = sorted(get_orientations(item), key=lambda o: (o[0], o[2], o[1]))
    for fs in self.free_spaces:
      for orient in valid_orientations:
        if fs.fits(orient):
          pos = (fs.x, fs.y, fs.z)
          self.add_placement(item, pos, orient)
          # Update free spaces: trim all that overlap with the placed item.
          self.update_free_spaces_with_trim(item, pos, orient)
          return True
    return False

# ----------------------------
# Helper: Try to merge two free spaces if they share a face and have same dimensions on the other axes.
# Returns merged FreeSpace if possible, otherwise None.
# ----------------------------


def try_merge(fs1, fs2):
  # Check for merge along x-axis
  if abs(fs1.y - fs2.y) < TOL and abs(fs1.z - fs2.z) < TOL and abs(fs1.height - fs2.height) < TOL and abs(fs1.depth - fs2.depth) < TOL:
    # If fs1 is immediately left of fs2 or vice versa.
    if abs((fs1.x + fs1.width) - fs2.x) < TOL:
      return FreeSpace(fs1.x, fs1.y, fs1.z, fs1.width + fs2.width, fs1.height, fs1.depth)
    if abs((fs2.x + fs2.width) - fs1.x) < TOL:
      return FreeSpace(fs2.x, fs2.y, fs2.z, fs2.width + fs1.width, fs2.height, fs2.depth)
  # Check for merge along y-axis
  if abs(fs1.x - fs2.x) < TOL and abs(fs1.z - fs2.z) < TOL and abs(fs1.width - fs2.width) < TOL and abs(fs1.depth - fs2.depth) < TOL:
    if abs((fs1.y + fs1.height) - fs2.y) < TOL:
      return FreeSpace(fs1.x, fs1.y, fs1.z, fs1.width, fs1.height + fs2.height, fs1.depth)
    if abs((fs2.y + fs2.height) - fs1.y) < TOL:
      return FreeSpace(fs2.x, fs2.y, fs2.z, fs2.width, fs2.height + fs1.height, fs2.depth)
  # Check for merge along z-axis
  if abs(fs1.x - fs2.x) < TOL and abs(fs1.y - fs2.y) < TOL and abs(fs1.width - fs2.width) < TOL and abs(fs1.height - fs2.height) < TOL:
    if abs((fs1.z + fs1.depth) - fs2.z) < TOL:
      return FreeSpace(fs1.x, fs1.y, fs1.z, fs1.width, fs1.height, fs1.depth + fs2.depth)
    if abs((fs2.z + fs2.depth) - fs1.z) < TOL:
      return FreeSpace(fs2.x, fs2.y, fs2.z, fs2.width, fs2.height, fs2.depth + fs1.depth)
  return None

# ----------------------------
# Data Classes for Item
# ----------------------------


class Item:
  def __init__(self, item_id, name, width, depth, height, mass_kg, priority, expiry, usage_limit, preferred_zone):
    self.id = item_id
    self.name = name
    self.width = width
    self.depth = depth
    self.height = height
    self.mass_kg = mass_kg
    self.priority = priority
    self.expiry = expiry if expiry != "N/A" else float("inf")
    self.usage_limit = usage_limit
    self.preferred_zone = preferred_zone

  def __repr__(self):
    return f"Item({self.id}, P:{self.priority})"

# ----------------------------
# Overall Packing Function
# ----------------------------


def pack_items(containers, items):
  # Sort items by: priority (ascending so least priority placed first),
  # expiry (sooner expires first), then usage_limit (lower first)
  sorted_items = sorted(
      items,
      key=lambda i: (i.priority,
                     i.expiry if i.expiry != float("inf") else datetime.max,
                     i.usage_limit)
  )
  unplaced = []
  for item in sorted_items:
    placed = False
    # Try preferred zone containers first
    target_containers = [c for c in containers if c.zone == item.preferred_zone]
    other_containers = [c for c in containers if c.zone != item.preferred_zone]
    for container in target_containers + other_containers:
      if container.place_item(item):
        placed = True
        break
    if not placed:
      unplaced.append(item)

  if unplaced:
    print("Items that couldn't be placed:")
    for item in unplaced:
      print(f"  - {item.id} ({item.name}), Priority: {item.priority}")

  for container in containers:
    print(f"Container {container.id} Mass: {container.total_mass():.2f} kg")

  return containers

# ----------------------------
# Utility: Check and Display Packing Results
# ----------------------------


def check_packing_results(containers):
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

      items = []
      for item, (x, y, z), orient in container.placements:
        item = {'size': {}, 'position': {}}
        item['size']['width'] = orient[0]
        item['size']['depth'] = orient[1]
        item['size']['height'] = orient[2]
        item['position']['x'] = x
        item['position']['y'] = y
        item['position']['z'] = -z
        items.append(item)
      with open(OUTPUT_DATA_FILE, "w") as f:
        json.dump({"items": items}, f, indent=2)

    else:
      print("No items packed.")

    print("Free Spaces:")
    if container.free_spaces:
      for fs in container.free_spaces:
        src = fs.source if fs.source else "N/A"
        print(f"  {fs} - caused by {src}")
    else:
      print("  None")

  print("\n✅ Packing verification complete!\n")

# ----------------------------
# Parsing Functions for Items and Containers
# ----------------------------


def parse_items(data):
  items = []
  lines = data.strip().split("\n")
  header = lines[0]
  for line in lines[1:]:
    parts = line.split(",")
    expiry_date = parts[7]  # Already a string ("N/A" or date)
    usage_limit = int(parts[8]) if parts[8] != "N/A" else float("inf")
    items.append(Item(parts[0], parts[1], float(parts[2]), float(parts[3]), float(parts[4]),
                      float(parts[5]), int(parts[6]), expiry_date, usage_limit, parts[9]))
  return items


def parse_containers(data):
  containers = []
  lines = data.strip().split("\n")
  header = lines[0]
  for line in lines[1:]:
    parts = line.split(",")
    containers.append(Container(parts[1], parts[0], float(parts[2]), float(parts[3]), float(parts[4])))
  return containers


# ----------------------------
# Example Execution
# ----------------------------
item_data = """
item_id,name,width_cm,depth_cm,height_cm,mass_kg,priority,expiry_date,usage_limit,preferred_zone
000001,Research_Samples,50,50,50,2.4,84,N/A,2304,Storage_Bay
000002,Research_Samples,50,50,50,2.4,84,N/A,2304,Storage_Bay
"""

container_data = """
zone,container_id,width_cm,depth_cm,height_cm
Command_Center,CC02,100.0,100.0,100.0
"""


def parse_items_2():
  items = []
  data = json.load(open(INPUT_DATA_FILE))
  for it in data["items"]:
    items.append(Item(0, 'test', it['size']["width"], it['size']["depth"], it['size']["height"],
                      2, 90, 'N/A', 10, 'BAY-Area'))
  return items


items = parse_items_2()
containers = parse_containers(container_data)

pack_items(containers, items)
check_packing_results(containers)
