import { Link } from "react-router";

import type { Route } from "./+types/home";
import { TileBand, tileFor } from "../components";
import { recipes } from "../recipes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Familiekookboek" }];
}

export default function Home() {
  return (
    <main id="main" className="page">
      <h1 className="h1">Wat eten we vandaag?</h1>
      <p className="lead">{recipes.length} recepten van de familie.</p>
      <ul className="grid">
        {recipes.map((r, i) => (
          <li key={r.slug}>
            <Link to={`/recepten/${r.slug}`} className="card">
              <img src={r.image} alt="" loading={i < 3 ? "eager" : "lazy"} width="640" height="400" />
              <TileBand first={tileFor(i)} />
              <span className="card-body">
                <span className="card-title">{r.title}</span>
                <span className="card-meta">
                  van {r.by} · {r.time}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
