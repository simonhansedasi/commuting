# commuting

Analyzes how rain and weather conditions affect commute times across different transport modes.

## What it does

Collects commute log entries (mode, duration, weather, road conditions) stored in SQLite. Runs statistical analysis (confidence intervals via scipy) and generates comparative visualizations — pie charts and stacked bars — showing transit time distributions across weather conditions.

## Tech

Python, Flask, SQLite, pandas, matplotlib, scipy, HTML/CSS/JS

## Run

```bash
python app.py
```

Open the web dashboard to log commutes and view charts.
