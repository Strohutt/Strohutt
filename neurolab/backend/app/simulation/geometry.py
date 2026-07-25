import numpy as np

INF = np.float32(1e9)


def raycast(origins, directions, seg_a, seg_b, max_range):
    # nearest hit distance for each ray against all segments at once
    R = origins.shape[0]
    W = seg_a.shape[0]
    if R == 0 or W == 0:
        return np.full((R,), max_range, dtype=np.float32)

    e = seg_b - seg_a
    ap = seg_a[None, :, :] - origins[:, None, :]

    dx = directions[:, 0][:, None]
    dy = directions[:, 1][:, None]
    ex = e[:, 0][None, :]
    ey = e[:, 1][None, :]

    denom = dx * ey - dy * ex
    safe = np.where(denom == 0, INF, denom)

    apx = ap[:, :, 0]
    apy = ap[:, :, 1]

    t = (apx * ey - apy * ex) / safe   # along the ray
    u = (apx * dy - apy * dx) / safe   # along the segment

    valid = (denom != 0) & (t >= 0) & (u >= 0) & (u <= 1)
    t = np.where(valid, t, INF)

    nearest = t.min(axis=1)
    return np.minimum(nearest, max_range).astype(np.float32)


def point_segment_distance(points, seg_a, seg_b):
    N = points.shape[0]
    W = seg_a.shape[0]
    if N == 0 or W == 0:
        return np.full((N,), INF, dtype=np.float32)

    e = seg_b - seg_a
    len2 = np.sum(e * e, axis=1)
    len2 = np.where(len2 == 0, 1e-9, len2)

    ap = points[:, None, :] - seg_a[None, :, :]
    proj = np.sum(ap * e[None, :, :], axis=2) / len2[None, :]
    proj = np.clip(proj, 0.0, 1.0)

    closest = seg_a[None, :, :] + proj[:, :, None] * e[None, :, :]
    diff = points[:, None, :] - closest
    d2 = np.sum(diff * diff, axis=2)
    return np.sqrt(d2.min(axis=1)).astype(np.float32)


def segments_cross_segment(p0, p1, a, b):
    # does each car's move p0->p1 cross its checkpoint a->b
    r = p1 - p0
    s = b - a
    rxs = r[:, 0] * s[:, 1] - r[:, 1] * s[:, 0]
    qp = a - p0
    safe = np.where(rxs == 0, 1e-9, rxs)
    t = (qp[:, 0] * s[:, 1] - qp[:, 1] * s[:, 0]) / safe
    u = (qp[:, 0] * r[:, 1] - qp[:, 1] * r[:, 0]) / safe
    return (rxs != 0) & (t >= 0) & (t <= 1) & (u >= 0) & (u <= 1)
