import React from 'react';
import ReactMarkdown from 'react-markdown';

type MarkdownRendererProps = {
  content: string;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      components={{
        code({ node, className, children, ...props }) {
          // Check if it's a code block (has language class) or inline code
          const isCodeBlock = className && className.startsWith('language-');
          
          return isCodeBlock ? (
            <pre className="bg-gray-900 text-green-200 p-4 rounded-md overflow-x-auto my-4">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          ) : (
            <code className="bg-gray-900 text-green-600 px-1 py-1 rounded" {...props}>
              {children}
            </code>
          );
        },
        // Alternative: You can also handle pre separately
        pre({ children }) {
          return (
            <pre className="bg-gray-900 text-green-200 p-4 rounded-md overflow-x-auto my-4">
              {children}
            </pre>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
