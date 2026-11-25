import sys; sys.path.insert(0, '/home/user/-/videos/_money-math'); from common import *
def cc(pay):
    bal = 5000.0; tot = 0; m = 0; pts = [(0, bal)]
    while bal > 0.005:
        i = bal * 0.02; p = min(pay(bal, i), bal + i); bal = bal + i - p; tot += i; m += 1
        pts.append((m / 12, max(bal, 0)))
    return m, tot, pts
mb, tb, B = cc(lambda b, i: max(i + 0.01 * b, 25)); ma, ta, A = cc(lambda b, i: 250)
B = B[::3] + [B[-1]]
EP = dict(slug='2026-11-26-credit-card', title='Paying the Minimum on $5,000 Takes 19 Years',
 lines=["Five thousand dollars on a credit card. Just pay the minimum?",
  "Mason and Lily both owe five thousand dollars.",
  "Same card. Twenty-four percent interest.",
  "Mason pays the minimum. Lily pays two hundred fifty a month.",
  "Mason takes nineteen years, and pays eight thousand nine hundred in interest.",
  "Lily is done in two years, with fourteen hundred in interest.",
  "The minimum cost Mason over seven thousand dollars extra.",
  "Always pay more than the minimum. Follow for more money math."],
 p1_kicker='Credit card debt', p1_big='$5,000',
 a=dict(name='Lily', initial='L', tag='owes $5,000', label='Lily', value=round(ta)),
 b=dict(name='Mason', initial='M', tag='owes $5,000', label='Mason', value=round(tb)),
 a_first=False, badge='<b>$5,000</b> balance · <b>24%</b> APR',
 p4_kicker='Monthly payment', row_first='sam', rows=[('Mason', 'minimum'), ('Lily', '$250')], plus='Minimum = interest + 1%, at least $25',
 p5_kicker='Interest paid', stamp_k='Cost of paying the minimum', stamp_v=f"−${round(tb-ta):,}",
 end='PAY MORE<br />THAN THE<br /><span>MINIMUM.</span>', end_size=110, disc='Assumes 24% APR (2% a month), no new purchases. Minimum payment = interest + 1% of the balance, at least $25.',
 x0=0, x1=20, maxv=5500, ygrid=[(1000, '$1k'), (2500, '$2.5k'), (5000, '$5k')], xticks=[(0, 'yr 0'), (5, '5'), (10, '10'), (15, '15'), (20, '20')],
 series_a=A, series_b=B, draw=(0.35, 1.0), tags='#creditcard #debt #personalfinance #money #shorts',
 notes=f"min: {mb} months, interest {round(tb)}; $250: {ma} months, interest {round(ta)}")
