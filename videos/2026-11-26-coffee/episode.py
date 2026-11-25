import sys; sys.path.insert(0, '/home/user/-/videos/_money-math'); from common import *
A = fvm_years(30, 0.08, 152.08)
B = [(y, 152.08 * 12 * y) for y in range(31)]
EP = dict(slug='2026-11-26-coffee', title='Your $5 Coffee Really Costs $226,000',
 lines=["Five dollars a day. What's it really costing you?",
  "Emma and Noah both have five dollars a day to spare.",
  "Thirty years. The market averages eight percent.",
  "Emma buys coffee. Noah invests it.",
  "After thirty years, Emma spent fifty-four thousand dollars on coffee.",
  "Noah has two hundred twenty-six thousand.",
  "So that daily coffee really cost about two hundred twenty-six thousand dollars.",
  "Enjoy the coffee. Just know the price. Follow for more money math."],
 p1_kicker='One coffee a day', p1_big='$5',
 a=dict(name='Noah', initial='N', tag='$5 / day', label='Noah has', value=round(A[-1][1])),
 b=dict(name='Emma', initial='E', tag='$5 / day', label='Emma spent', value=round(B[-1][1])),
 a_first=False, badge='<b>$5</b>/day · <b>30</b> yrs · market <b>8%</b>',
 p4_kicker='Where the $5 goes', row_first='sam', rows=[('Emma · coffee', '☕'), ('Noah · invests', '📈')], plus='Same $54,749 out of pocket',
 p5_kicker='After 30 years', stamp_k='True cost of the coffee', stamp_v=f"${round(A[-1][1]):,}",
 end='KNOW THE<br /><span>PRICE.</span>', disc='Assumes $152 a month (about $5 a day) invested monthly at an 8% average yearly return, before fees, taxes and inflation.',
 x0=0, x1=30, maxv=250000, ygrid=[(v, k(v)) for v in (50000, 100000, 150000, 200000)], xticks=[(0, 'yr 0'), (10, '10'), (20, '20'), (30, '30')],
 series_a=A, series_b=B, tags='#personalfinance #investing #money #frugal #shorts', notes=f"invested {round(A[-1][1])}, spent {round(B[-1][1])}")
