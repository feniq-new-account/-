import sys; sys.path.insert(0, '/home/user/-/videos/_money-math'); from common import *
r = 0.08 / 12
need = lambda n: 1_000_000 * r / ((1 + r) ** n - 1)
na, nb = need(480), need(240)
A = [(25 + y, v) for y, v in fvm_years(40, 0.08, na)]
B = [(45 + y, v) for y, v in fvm_years(20, 0.08, nb)]
extra = round(nb * 240 - na * 480)
EP = dict(slug='2026-11-26-million', title='How Much to Save to Retire a Millionaire',
 lines=["How much do you need to save to retire a millionaire?",
  "Olivia starts at twenty-five. Jack starts at forty-five.",
  "Both want one million dollars by sixty-five. Eight percent a year.",
  "Olivia has forty years. Jack has only twenty.",
  "Jack needs one thousand six hundred ninety-eight dollars a month.",
  "Olivia needs just two hundred eighty-six.",
  "Jack pays in two hundred seventy thousand dollars more, for the same million.",
  "Time is the cheapest money you have. Follow for more money math."],
 p1_kicker='Retire a millionaire', p1_big='$1M',
 a=dict(name='Olivia', initial='O', tag='starts at 25', label='Olivia', value=round(na), suffix='/mo'),
 b=dict(name='Jack', initial='J', tag='starts at 45', label='Jack', value=round(nb), suffix='/mo'),
 a_first=True, badge='goal <b>$1M</b> at <b>65</b> · <b>8%</b> a year',
 p4_kicker='Time to grow', row_first='alex', rows=[('Olivia', '40 years'), ('Jack', '20 years')], plus='Same goal: $1,000,000',
 p5_kicker='Needed per month', stamp_k='Extra Jack pays in', stamp_v=f"+${extra:,}",
 end='TIME IS<br /><span>MONEY.</span>', disc='Assumes monthly deposits and an 8% average yearly return compounded monthly, before fees, taxes and inflation.',
 x0=25, x1=65, maxv=1_100_000, ygrid=[(v, k(v)) for v in (250000, 500000, 750000, 1000000)], xticks=[(25, '25'), (35, '35'), (45, '45'), (55, '55'), (65, '65')],
 series_a=A, series_b=B, tags='#retirement #millionaire #investing #personalfinance #shorts',
 notes=f"olivia {round(na)}/mo total {round(na*480)}; jack {round(nb)}/mo total {round(nb*240)}; extra {extra}")
