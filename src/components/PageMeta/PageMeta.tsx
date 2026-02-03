import { Helmet } from 'react-helmet-async';
import { GAME_URL } from '../../config/gameConfig';

interface PageMetaProps {
  title: string;
  description?: string;
  path?: string;
}

export default function PageMeta({ title, description, path = '/' }: PageMetaProps) {
  const canonical = path === '/' ? GAME_URL : `${GAME_URL}${path.startsWith('/') ? path : `/${path}`}`;
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
    </Helmet>
  );
}
