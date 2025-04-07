from datetime import datetime


def pack_items(containers, items):
  # Sort items
  sorted_items = sorted(
      items,
      key=lambda i: (  # Negative to sort largest first
          -(i.width * i.depth * i.height),
          i.priority,
          i.expiry,
          i.usage_limit)
  )

  placed = []
  unplaced = []
  temp_unplaced = []

  for item in sorted_items:
    was_placed = False
    # Try preferred zone containers first
    target_containers = [c for c in containers if c.zone == item.preferred_zone]
    for container in target_containers:
      if container.place_item(item):
        placed.append(item)
        was_placed = True
        break
    if not was_placed:
      temp_unplaced.append(item)

  # Try to place remaining items in non-preferred containers
  for item in temp_unplaced:
    was_placed = False
    other_containers = [c for c in containers if c.zone != item.preferred_zone]
    for container in other_containers:
      if container.place_item(item):
        placed.append(item)
        was_placed = True
        break
    if not was_placed:
      unplaced.append(item)

  return containers, placed, unplaced
