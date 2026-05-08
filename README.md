# pcfbench.github.io

> The site is **hidden** until the arXiv paper is released.
>
> - `main` carries only a 404 / coming-soon page (this is what visitors see).
> - The complete project page lives on the **[`staging`](../../tree/staging)** branch.

## Re-publish (when paper is on arXiv)

```bash
git checkout main
git checkout staging -- index.html website/
git rm 404.html
git commit -m "Publish: paper now on arXiv"
git push
```

## Pull future edits back from main → staging

```bash
git checkout staging
git merge main
git push
```
