from .FreeSpace import FreeSpace, try_merge, TOL
from itertools import permutations


def get_orientations(item):
  dims = (item.width, item.depth, item.height)
  return {perm for perm in permutations(dims)}


def trim_free_space(fs, placed_bounds):
  fx1, fy1, fz1, fx2, fy2, fz2 = fs.get_bounds()
  px1, py1, pz1, px2, py2, pz2 = placed_bounds

  if (px2 <= fx1 + TOL or px1 >= fx2 - TOL or
      py2 <= fy1 + TOL or py1 >= fy2 - TOL or
          pz2 <= fz1 + TOL or pz1 >= fz2 - TOL):
    return [fs]

  new_spaces = []
  if px1 > fx1 + TOL:
    new_spaces.append(FreeSpace(fx1, fy1, fz1, px1 - fx1, fs.height, fs.depth, fs.source))
  if px2 < fx2 - TOL:
    new_spaces.append(FreeSpace(px2, fy1, fz1, fx2 - px2, fs.height, fs.depth, fs.source))
  if py1 > fy1 + TOL:
    new_spaces.append(FreeSpace(max(fx1, px1), fy1, fz1, min(fx2, px2) - max(fx1, px1), py1 - fy1, fs.depth, fs.source))
  if py2 < fy2 - TOL:
    new_spaces.append(FreeSpace(max(fx1, px1), py2, fz1, min(fx2, px2) - max(fx1, px1), fy2 - py2, fs.depth, fs.source))
  if pz1 > fz1 + TOL:
    new_spaces.append(FreeSpace(max(fx1, px1), max(fy1, py1), fz1, min(fx2, px2) - max(fx1, px1),
                                min(fy2, py2) - max(fy1, py1), pz1 - fz1, fs.source))
  if pz2 < fz2 - TOL:
    new_spaces.append(FreeSpace(max(fx1, px1), max(fy1, py1), pz2, min(fx2, px2) - max(fx1, px1),
                                min(fy2, py2) - max(fy1, py1), fz2 - pz2, fs.source))

  valid_spaces = [space for space in new_spaces if space.width > TOL and space.height > TOL and space.depth > TOL]
  return valid_spaces


class Container:
  def __init__(self, container_id, zone, width, depth, height):
    self.id = container_id
    self.zone = zone
    self.width = width
    self.depth = depth
    self.height = height
    self.placements = []
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
    px, py, pz = pos
    iw, id_, ih = orient
    placed_bounds = (px, py, pz, px + iw, py + ih, pz + id_)
    new_free_spaces = []
    for fs in self.free_spaces:
      trimmed = trim_free_space(fs, placed_bounds)
      new_free_spaces.extend(trimmed)
    self.free_spaces = [fs for fs in new_free_spaces if fs.width > TOL and fs.height > TOL and fs.depth > TOL]
    self.merge_free_spaces()

  def merge_free_spaces(self):
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
    self.free_spaces.sort(key=lambda fs: (fs.z, fs.y, fs.x))
    valid_orientations = sorted(get_orientations(item), key=lambda o: (o[0], o[2], o[1]))
    for fs in self.free_spaces:
      for orient in valid_orientations:
        if fs.fits(orient):
          pos = (fs.x, fs.y, fs.z)
          self.add_placement(item, pos, orient)
          self.update_free_spaces_with_trim(item, pos, orient)
          return True
    return False
