from typing import List, Tuple

# Tolerance for floating-point comparisons
TOL = 1e-6


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
