import sys; sys.path.insert(0, '/home/user/-/videos/_money-math'); from common import *
A = fvm_years(30, 0.08, 300); B = fvm_years(30, 0.005, 300)
gap = round(A[-1][1] - B[-1][1])
EP = dict(slug='2026-11-26-bank-vs-market', title='Your Savings Account Is Costing You $330,000',
 lines=["Is your savings account making you poorer?",
  "Liam and Zoe both save three hundred dollars a month.",
  "For thirty years. Same habit, same money.",
  "Liam's bank pays half a percent. Zoe's index fund averages eight.",
  "Liam ends with one hundred sixteen thousand.",
  "Zoe ends with four hundred forty-seven thousand.",
  "Same savings. Over three hundred thirty thousand dollars apart.",
  "Keep your emergency fund in the bank, and invest the rest. Follow for more money math."],
 p1_kicker='Savings account', p1_big='0.5%',
 a=dict(name='Zoe', initial='Z', tag='$300 / month', label='Zoe', value=round(A[-1][1])),
 b=dict(name='Liam', initial='L', tag='$300 / month', label='Liam', value=round(B[-1][1])),
 a_first=False, badge='<b>$300</b>/mo · <b>30</b> yrs · <b>$108,000</b> in',
 p4_kicker='Where it sits', row_first='sam', rows=[('Liam · bank', '0.5%'), ('Zoe · index fund', '8%')], plus='Both put in $108,000',
 p5_kicker='After 30 years', stamp_k='The cost of playing it safe', stamp_v=f"−${gap:,}",
 end='MAKE IT<br /><span>WORK.</span>', disc='Assumes $300 a month for 30 years: 0.5% savings rate vs an 8% average yearly market return, compounded monthly, before fees, taxes and inflation. Markets can fall.',
 x0=0, x1=30, maxv=500000, ygrid=[(v, k(v)) for v in (100000, 200000, 300000, 400000)], xticks=[(0, 'yr 0'), (10, '10'), (20, '20'), (30, '30')],
 series_a=A, series_b=B, tags='#investing #savings #indexfunds #personalfinance #shorts', notes=f"market {round(A[-1][1])}, bank {round(B[-1][1])}, gap {gap}")
