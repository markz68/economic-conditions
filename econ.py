"""Download public FRED CSV series; retain prior successful series on failure."""
import csv, io, json, math, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
ROOT = Path(__file__).resolve().parent
# id, label, category, frequency, display, transform
SPECS = [
('UNRATE','Unemployment rate','Jobs and pay','M','percent','level'),
('PAYEMS','Nonfarm payroll jobs','Jobs and pay','M','jobs','level'),
('LNS12300060','Employment rate · ages 25–54','Jobs and pay','M','percent','level'),
('LES1252881600Q','Real median weekly earnings','Jobs and pay','Q','dollars','level'),
('CPIAUCSL','CPI inflation · year over year','Household costs','M','percent','yoy'),
('CPIAUCSL','Cumulative price change','Household costs','M','percent','cumulative'),
('CUSR0000SAF11','Grocery inflation · year over year','Household costs','M','percent','yoy'),
('CUSR0000SAH1','Shelter inflation · year over year','Household costs','M','percent','yoy'),
('MORTGAGE30US','30-year mortgage rate','Household costs','W','percent','level'),
('GASREGW','Regular gasoline · per gallon','Household costs','W','currency','level'),
('A191RL1Q225SBEA','Real GDP growth · quarterly annualized','Economy and finances','Q','percent','level'),
('A229RX0','Real disposable income · per person','Economy and finances','M','dollars','level'),
('GFDEGDQ188S','Gross federal debt / GDP','Economy and finances','Q','percent','level'),
('FYFSGDA188S','Federal deficit / GDP · fiscal year','Economy and finances','A','percent','negate'),
('APU0000708111','Grade A eggs · per dozen','Price details','M','currency','level'),
('TDSP','Household debt payments / disposable income','Price details','Q','percent','level')]
def fetch(sid):
    url=f'https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}&cosd=1999-01-01'
    last=None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url,timeout=45) as response:
                rows=csv.DictReader(io.StringIO(response.read().decode('utf-8-sig')))
                points=[]
                for row in rows:
                    try: v=float(row[sid])
                    except (ValueError, KeyError): continue
                    if math.isfinite(v): points.append([row['observation_date'],v])
            if not points: raise ValueError('No observations')
            return sid,{'points':points,'fetched':datetime.now(timezone.utc).isoformat(),'error':False}
        except Exception as exc: last=type(exc).__name__
    return sid,{'error':True,'reason':last}
def main():
    path=ROOT/'data.json'
    previous=json.loads(path.read_text()) if path.exists() else {'series':{}}
    series=previous.get('series',{})
    for sid,result in ThreadPoolExecutor(max_workers=5).map(fetch,sorted({s[0] for s in SPECS})):
        if result['error']:
            series[sid]={**series.get(sid,{'points':[]}), 'error':True}
            print(f'{sid}: update failed; retaining previous observations')
        else:
            series[sid]=result; print(f'{sid}: {len(result["points"])} observations')
    payload={'version':1,'attempted':datetime.now(timezone.utc).isoformat(),'series':series,
             'metrics':[dict(zip(['id','label','group','frequency','format','transform'],s)) for s in SPECS]}
    temp=path.with_suffix('.tmp');temp.write_text(json.dumps(payload,separators=(',',':')));temp.replace(path)
    if not any(s.get('points') for s in series.values()): raise SystemExit('No data available')
if __name__=='__main__': main()
