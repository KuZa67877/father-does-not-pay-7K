import { Info } from 'lucide-react';
import { usePageMeta } from '@/shared/lib/meta';
import { SITE_NAME } from '@/shared/config/env';
import { PageHero } from '@/widgets/page-hero/PageHero';

/** Статическая страница «О редакции и правила». */
export function AboutPage() {
  usePageMeta({
    title: `О редакции — ${SITE_NAME}`,
    description: 'Кто делает «Хронику» и по каким правилам.',
  });
  return (
    <>
      <PageHero
        crumb="О редакции"
        title="О редакции"
        icon={<Info size={34} />}
        lead={`«${SITE_NAME}» — учебный проект: вымышленное городское издание.`}
      />
      <article className="container" style={{ paddingBottom: 80 }}>
        <div className="prose-static">
          <h2>Что это</h2>
          <p>
            Сайт повторяет композицию и поведение новостного шаблона, но все тексты, имена и
            картинки — вымышленные. Данные приходят из мок-сервера, а архитектура позволяет
            подключить настоящий бекенд или CMS без изменений в интерфейсе.
          </p>
          <h2>Правила комментариев</h2>
          <ul>
            <li>Спорьте с аргументами, а не с людьми.</li>
            <li>Без оскорблений, спама и рекламы.</li>
            <li>Модерация удаляет комментарии, нарушающие правила, без предупреждения.</li>
          </ul>
          <h2>Возрастная маркировка</h2>
          <p>Материалы сайта предназначены для читателей старше 16 лет.</p>
        </div>
      </article>
    </>
  );
}
