from datetime import datetime


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
  placed = []
  for item in sorted_items:
    was_placed = False
    # Try preferred zone containers first
    target_containers = [c for c in containers if c.zone == item.preferred_zone]
    other_containers = [c for c in containers if c.zone != item.preferred_zone]
    for container in target_containers + other_containers:
      if container.place_item(item):
        placed.append(item)
        was_placed = True
        break
    if not was_placed:
      unplaced.append(item)

  return containers, placed, unplaced
