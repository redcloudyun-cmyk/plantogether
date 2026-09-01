import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { useLanguageStore } from '.';
import { useTranslation } from '.';

function TranslationProbe() {
  const { t } = useTranslation();
  return createElement('div', null, `${t('dashboard')} | ${t('resetDemo')} | ${t('agentProposal')}`);
}

describe('language preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    useLanguageStore.setState({ language: 'en' });
  });

  it('uses English as the default language', () => {
    expect(useLanguageStore.getState().language).toBe('en');
  });

  it('persists the selected language', () => {
    useLanguageStore.getState().setLanguage('ko');
    expect(useLanguageStore.getState().language).toBe('ko');
    expect(localStorage.getItem('withgex-language')).toContain('"language":"ko"');
  });

  it('updates mounted UI immediately when the language changes', () => {
    render(createElement(TranslationProbe));
    expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    act(() => useLanguageStore.getState().setLanguage('ko'));
    expect(screen.getByText(/대시보드/)).toHaveTextContent('데모 초기화');
    expect(screen.getByText(/대시보드/)).toHaveTextContent('에이전트 제안');
  });
});
