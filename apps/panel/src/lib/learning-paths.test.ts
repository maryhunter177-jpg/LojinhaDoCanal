import { describe, expect, it } from 'vitest';
import { learningPaths } from './learning-paths';
import { curatedCatalog } from './curated-catalog';

describe('integridade das trilhas de estudos', () => {
  it('liga todas as etapas a cursos publicados e mantém slugs únicos', () => {
    expect(new Set(learningPaths.map((path) => path.id)).size).toBe(
      learningPaths.length,
    );
    for (const path of learningPaths)
      for (const step of path.steps)
        if (step.slug) {
          expect(
            curatedCatalog.filter(
              (item) =>
                item.slug === step.slug &&
                item.kind === 'course' &&
                item.published,
            ),
          ).toHaveLength(1);
        }
    expect(
      curatedCatalog.filter((item) => item.kind === 'course'),
    ).toHaveLength(17);
    expect(curatedCatalog.some((item) => item.slug === 'kotlin-avancado')).toBe(
      false,
    );
  });
  it('organiza web com JavaScript antes do tutorial de jogos e do projeto final', () => {
    const steps = learningPaths.find((path) => path.id === 'web')?.steps ?? [];
    expect(steps.map((step) => step.slug).filter(Boolean)).toEqual([
      'introducao-a-programacao',
      'introducao-ao-html',
      'html-e-css',
      'aprendendo-javascript',
    ]);
    expect(steps[4]?.resource).toBe(
      'https://developer.mozilla.org/en-US/docs/Games/Tutorials',
    );
    expect(steps[5]?.slug).toBeUndefined();
  });
  it('mantém as engines em caminhos independentes e separa Java de JavaScript', () => {
    for (const [id, slug] of [
      ['unity', 'unity-iniciantes'],
      ['godot', 'jogos-godot'],
      ['unreal', 'game-dev-unreal'],
    ]) {
      const steps = learningPaths.find((path) => path.id === id)?.steps ?? [];
      expect(steps[0]?.slug).toBe('introducao-a-programacao');
      expect(steps.some((step) => step.slug === slug)).toBe(true);
      expect(
        steps.filter((step) =>
          ['unity-iniciantes', 'jogos-godot', 'game-dev-unreal'].includes(
            step.slug ?? '',
          ),
        ),
      ).toHaveLength(1);
    }
    expect(
      learningPaths
        .find((path) => path.id === 'web')
        ?.steps.some((step) => step.slug === 'programar-java'),
    ).toBe(false);
  });
});
