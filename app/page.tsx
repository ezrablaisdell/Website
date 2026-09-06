export default function Home() {
  return (
    <div className="site-shell">
      <header><a className="wordmark" href="/" aria-label="Ezra Blaisdell home">EB<span>.</span></a><a href="https://github.com/ezrablaisdell">GitHub ↗</a></header>
      <main>
        <p className="eyebrow">● &nbsp; A first step. Plenty more to come.</p>
        <h1>Hi, I’m Ezra<span>.</span></h1>
        <p className="intro">Welcome to my little corner of the internet. This is where my projects begin.</p>
        <a className="primary-link" href="https://github.com/ezrablaisdell">Find me on GitHub <span aria-hidden="true">↗</span></a>
        <section aria-labelledby="project-title" className="project">
          <div className="project-number">01 / FIRST PROJECT</div>
          <div><h2 id="project-title">A place to start.</h2><p>My first personal website, built with a little curiosity and saved on GitHub.</p></div>
          <a href="https://github.com/ezrablaisdell/Website" className="source-link">Explore the code ↗</a>
        </section>
      </main>
      <footer><span>Ezra Blaisdell</span><span>Made one step at a time.</span></footer>
    </div>
  );
}

