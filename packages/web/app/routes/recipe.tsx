import { useState } from "react";
import { Link, data } from "react-router";

import type { Route } from "./+types/recipe";
import { TileBand, Wave, tileFor } from "../components";
import { findRecipe, recipes } from "../recipes";

export function loader({ params }: Route.LoaderArgs) {
  const recipe = findRecipe(params.slug);
  if (!recipe) throw data("Recept niet gevonden", { status: 404 });
  return { recipe, tile: tileFor(recipes.indexOf(recipe)) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.recipe.title ?? "Recept"} · Familiekookboek` }];
}

export default function Recipe({ loaderData }: Route.ComponentProps) {
  const { recipe: r, tile } = loaderData;
  const [done, setDone] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(0);

  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  return (
    <main id="main" className="page">
      <Link to="/" className="back">
        ← Alle recepten
      </Link>
      <h1 className="h1">{r.title}</h1>
      <p className="meta">
        <span className="by">van {r.by}</span>
        <span>{r.time}</span>
        <span>{r.servings} personen</span>
      </p>
      <p className="lead">{r.intro}</p>

      <div className="hero">
        <img src={r.image} alt="" width="1280" height="640" />
        <TileBand first={tile} />
      </div>

      <div className="cols">
        <section aria-labelledby="ing">
          <h2 id="ing" className="h2">
            Ingrediënten
          </h2>
          <ul className="ings">
            {r.ingredients.map((x, i) => (
              <li key={i}>
                <label className={done.has(i) ? "ing done" : "ing"}>
                  <input type="checkbox" checked={done.has(i)} onChange={() => toggle(i)} />
                  <b>{x.q}</b>
                  <span>{x.item}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="bereiding">
          <h2 id="bereiding" className="h2">
            Bereiding
          </h2>
          <ol className="steps">
            {r.steps.map((s, i) => {
              const active = i === current;
              return (
                <li key={i} className={active ? "step on" : i < current ? "step past" : "step"}>
                  <button className="step-hit" onClick={() => setCurrent(i)} aria-current={active ? "step" : undefined}>
                    <small>
                      Stap {i + 1} van {r.steps.length}
                    </small>
                    <span>{s}</span>
                  </button>
                  {active && (
                    <div className="step-nav">
                      <button className="btn" disabled={i === 0} onClick={() => setCurrent(i - 1)}>
                        Vorige
                      </button>
                      <button
                        className="btn btn-main"
                        disabled={i === r.steps.length - 1}
                        onClick={() => setCurrent(i + 1)}
                      >
                        Volgende
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <Wave />
        </section>
      </div>
    </main>
  );
}
