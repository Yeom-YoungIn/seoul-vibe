import { useEffect } from 'react';

const SCRIPT_ID = 'instagram-embed-js';

/** Instagram 공식 임베드. embed.js는 문서당 한 번만 넣고, 이후에는 process()로 다시 그린다 */
export default function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) {
      window.instgrm?.Embeds.process();
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = 'https://www.instagram.com/embed.js';
    document.body.appendChild(script);
  }, [url]);

  return (
    <blockquote
      key={url}
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
    >
      <a href={url} target="_blank" rel="noopener">
        {url}
      </a>
    </blockquote>
  );
}
