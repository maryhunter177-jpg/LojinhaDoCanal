'use client';
import { useState } from 'react';
import { ArrowRight, BookOpen, Code2, ExternalLink } from 'lucide-react';
import type { CatalogItem } from '@ofertas/core';
import { learningPaths } from '@/lib/learning-paths';

export function LearningPaths({
  items,
  onSelect,
}: {
  items: CatalogItem[];
  onSelect: (item: CatalogItem) => void;
}) {
  const [active, setActive] = useState('web');
  const path =
    learningPaths.find((entry) => entry.id === active) ?? learningPaths[0];
  if (!path) return null;
  return (
    <section
      id="trilhas"
      className="learning-paths"
      aria-labelledby="learning-heading"
    >
      <div className="learning-intro">
        <div>
          <span className="eyebrow">UM PASSO DE CADA VEZ</span>
          <h3 id="learning-heading">Escolha seu objetivo. Siga seu caminho.</h3>
        </div>
        <Code2 size={30} aria-hidden="true" />
      </div>
      <p className="learning-guidance">
        Comece pela lógica e escolha uma trilha. Você não precisa comprar todos
        os cursos nem aprender todas as engines.
      </p>
      <div className="learning-choices" aria-label="Escolher trilha de estudos">
        {learningPaths.map((entry) => (
          <button
            key={entry.id}
            aria-pressed={entry.id === active}
            onClick={() => setActive(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div className="learning-plan" key={path.id}>
        <h4>{path.goal}</h4>
        <p className="learning-prerequisite">{path.prerequisite}</p>
        <ol className="learning-steps">
          {path.steps.map((step, index) => {
            const item = step.slug
              ? items.find(
                  (entry) =>
                    entry.kind === 'course' &&
                    entry.slug === step.slug &&
                    entry.published,
                )
              : undefined;
            return (
              <li key={step.title}>
                <span className="learning-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="learning-step-copy">
                  <h5>{step.title}</h5>
                  {item && (
                    <p className="learning-course-name">
                      <BookOpen size={14} aria-hidden="true" />
                      {item.title}
                    </p>
                  )}
                  <p>{step.practice}</p>
                  {item ? (
                    <button
                      className="learning-course-button"
                      onClick={() => onSelect(item)}
                    >
                      Ver curso e condições <ArrowRight size={15} />
                    </button>
                  ) : step.resource ? (
                    <a
                      className="learning-course-button"
                      href={step.resource}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Tutorial gratuito na MDN <ExternalLink size={14} />
                    </a>
                  ) : step.slug ? (
                    <span className="learning-missing">
                      Curso ainda não disponível no catálogo.
                    </span>
                  ) : (
                    <span className="learning-practice">
                      PRÁTICA SUGERIDA · SEM COMPRA ADICIONAL
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="learning-footnote">
        Sequência sugerida pela Mary com base nos temas. Confira a ementa e os
        pré-requisitos de cada curso antes de comprar. As imagens dos cursos são
        ilustrativas até recebermos as capas oficiais. Links de compra são de
        afiliado.
      </p>
    </section>
  );
}
