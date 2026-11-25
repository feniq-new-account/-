def fvm_years(years, r, pmt, start=0.0, step=1):
    b = start; pts = [(0, b)]
    for m in range(1, years * 12 + 1):
        b = b * (1 + r / 12) + pmt
        if m % 12 == 0: pts.append((m // 12, b))
    return pts
def k(v): return f"${v/1e6:g}M" if v >= 1e6 else f"${int(v//1000)}k"
