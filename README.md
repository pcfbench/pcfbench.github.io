# PCFBench Project Page

Source for <https://pcfbench.github.io/>, the project page of *PCFBench: How Far Can Large Vision-Language Models Go in Physics-aware Photonic Inverse Design?* (NeurIPS 2026, Evaluations & Datasets Track).

- Dataset: <https://huggingface.co/datasets/PCF-Bench/PCF-Bench>
- Evaluation code: <https://github.com/shengchaochen82/PCF-Bench-Eval>

## Layout

- `index.html`: the single page
- `assets/css/site.css`: all styles
- `assets/js/`: `main.js` (nav, reveal, lightbox), `animation.js` (inverse-design animation, GSAP), `samples.js`, `families.js`, `leaderboard.js`
- `data/`: `leaderboard.json`, `mas.json`, `families.json`, `samples.json`, `case07.json`, generated from the paper tables and the case study
- `assets/img/`: optimized images, vendor icons (lobe-icons, MIT) and brand assets

No build step. Preview locally with:

```
python3 -m http.server 8000
# open http://localhost:8000
```

## Remaining edit

- [ ] Fill the arXiv link once the paper is live (search `index.html` for `PAPER-LINK`, three places).
