import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (props) => <h1 {...props} className="mt-8 mb-4 text-2xl font-bold text-ink" />,
        h2: (props) => <h2 {...props} className="mt-7 mb-3 text-xl font-bold text-ink" />,
        h3: (props) => <h3 {...props} className="mt-6 mb-2 text-lg font-bold text-ink" />,
        p: (props) => <p {...props} className="mb-4 leading-7 text-ink/90" />,
        a: (props) => (
          <a {...props} className="font-semibold text-purple underline hover:text-purple-2" />
        ),
        ul: (props) => <ul {...props} className="mb-4 list-disc space-y-1 pl-6 text-ink/90" />,
        ol: (props) => <ol {...props} className="mb-4 list-decimal space-y-1 pl-6 text-ink/90" />,
        li: (props) => <li {...props} className="leading-7" />,
        code: ({
          inline,
          ...props
        }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) => (
          <code
            {...props}
            className={
              inline
                ? "rounded-md bg-[#efe9fb] px-1.5 py-0.5 text-sm font-mono text-purple"
                : "block overflow-x-auto rounded-xl bg-[#0e1239] p-4 text-sm font-mono text-white"
            }
          />
        ),
        pre: (props) => <pre {...props} className="mb-4 rounded-xl" />,
        blockquote: (props) => (
          <blockquote {...props} className="mb-4 border-l-4 border-purple pl-4 italic text-ink/70" />
        ),
        hr: (props) => <hr {...props} className="my-6 border-ink/10" />,
      }}
    >
      {source}
    </ReactMarkdown>
  );
}
