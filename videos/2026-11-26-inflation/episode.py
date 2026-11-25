import sys; sys.path.insert(0, '/home/user/-/videos/_money-math'); from common import *
B = [(y, 100000 / 1.03 ** y) for y in range(31)]
A = [(y, 100000 * (1.07 / 1.03) ** y) for y in range(31)]
EP = dict(slug='2026-11-26-inflation', title='Why $100,000 in Cash Loses 59% in 30 Years',
 lines=["A hundred thousand dollars in cash. Safe, right?",
  "Ava and Ben each get one hundred thousand dollars.",
  "Thirty years go by. Prices rise three percent a year.",
  "Ava keeps it in cash. Ben invests it at seven percent.",
  "In today's money, Ava's cash buys what forty-one thousand buys now.",
  "Ben's is worth three hundred thirteen thousand.",
  "Doing nothing quietly cost Ava almost sixty percent.",
  "Cash is safe from crashes, not from inflation. Follow for more money math."],
 p1_kicker='Cash under the mattress', p1_big='$100k',
 a=dict(name='Ben', initial='B', tag='$100,000', label='Ben', value=round(A[-1][1])),
 b=dict(name='Ava', initial='A', tag='$100,000', label='Ava', value=round(B[-1][1])),
 a_first=False, badge='<b>$100k</b> · <b>30</b> yrs · inflation <b>3%</b>',
 p4_kicker='What they do', row_first='sam', rows=[('Ava · cash', '0%'), ('Ben · invests', '7%')], plus="Shown in today's dollars",
 p5_kicker="In today's dollars", stamp_k='Lost to inflation', stamp_v='−59%',
 end='BEAT<br /><span>INFLATION.</span>', end_size=130, disc="Assumes 3% yearly inflation and a 7% average yearly return, values in today's dollars, before fees and taxes. Markets can fall.",
 x0=0, x1=30, maxv=350000, ygrid=[(v, k(v)) for v in (100000, 200000, 300000)], xticks=[(0, 'yr 0'), (10, '10'), (20, '20'), (30, '30')],
 series_a=A, series_b=B, tags='#inflation #investing #money #personalfinance #shorts', notes=f"cash real {round(B[-1][1])}, invested real {round(A[-1][1])}")
