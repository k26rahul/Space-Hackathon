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
