import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { articlesApi, ArticleListItem } from '../lib/api/articles';
import { postsApi, Post } from '../lib/api/posts';
import { categoryLabel, formatDate, postTitle } from '../lib/format';
import { useLanguage, useLocalePath } from '../hooks/useLanguage';
import { useHeaderTone } from '../hooks/useHeaderTone';
import Spinner from '../components/ui/Spinner';
import PostCard from '../components/ui/PostCard';
import FeatureCover from '../components/ui/FeatureCover';
import Byline from '../components/ui/Byline';
import { ArrowIcon } from '../components/ui/Icon';

export default function HomePage() {
  const lp = useLocalePath();
  const { language } = useLanguage();
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  useHeaderTone('light');

  useEffect(() => {
    Promise.all([articlesApi.getList({ language, take: 5 }), postsApi.getFeed({ take: 7 })])
      .then(([articleRes, postRes]) => {
        setArticles(articleRes.list);
        setPosts(postRes.list);
      })
      .finally(() => setLoading(false));
  }, [language]);

  if (loading)
    return (
      <div className="page-loading">
        <Spinner />
      </div>
    );

  const featured = posts.find((p) => p.images.length > 0) ?? posts[0];
  const restPosts = posts.filter((p) => p !== featured).slice(0, 6);
  const [leadArticle, ...moreArticles] = articles;

  return (
    <>
      <section className="split">
        <div className="split-side">
          {featured ? (
            <FeatureCover
              to={lp(`/posts/${featured.id}`)}
              image={featured.images[0]}
              label={categoryLabel(featured.category)}
              title={postTitle(featured.content)}
              excerpt={featured.locationName}
              date={formatDate(featured.createdAt)}
              byline={<Byline author={featured.author} size="lg" />}
              as="h1"
            />
          ) : (
            <div className="feature is-ink">
              <div className="feature-body">
                <h1 className="feature-title">Discover the real Seoul</h1>
                <p className="feature-excerpt">
                  Local restaurants, indie cafés, and off-the-beaten-path spots, curated by people
                  who live here.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="split-main surface-lime">
          {restPosts.length > 0 ? (
            <div className="stagger">
              {restPosts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <div className="empty-block">
              <h2>No posts yet.</h2>
              <p>Be the first to share a spot in Seoul.</p>
              <Link to={lp('/posts/new')} className="btn btn-primary">
                Share a spot
              </Link>
            </div>
          )}
          <Link to={lp('/feed')} className="more-link">
            Community feed <ArrowIcon />
          </Link>
        </div>
      </section>

      {leadArticle && (
        <section className="split split-reverse">
          <div className="split-main surface-paper">
            <h2 className="band-title">Seoul Vibes</h2>
            {moreArticles.length > 0 ? (
              <div className="stagger">
                {moreArticles.map((a) => (
                  <Link key={a.id} to={lp(`/articles/${a.slug}`)} className="article-card">
                    <span className="label">Guide</span>
                    <h3>{a.title}</h3>
                    <time>{formatDate(a.createdAt)}</time>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="muted">More guides are on the way.</p>
            )}
            <Link to={lp('/articles')} className="more-link">
              All guides <ArrowIcon />
            </Link>
          </div>
          <div className="split-side">
            <FeatureCover
              to={lp(`/articles/${leadArticle.slug}`)}
              label="Guide"
              title={leadArticle.title}
              date={formatDate(leadArticle.createdAt)}
            />
          </div>
        </section>
      )}
    </>
  );
}
