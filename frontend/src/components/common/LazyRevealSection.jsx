import React, { useState, useEffect, useRef } from 'react';

export default function LazyRevealSection({ 
  children, 
  rootMargin = '200px 0px', 
  threshold = 0.05, 
  minHeight = 300,
  className = ''
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    // Nếu thiết bị/trình duyệt không hỗ trợ IntersectionObserver, fallback render lập tức
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setShouldRender(true);
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setShouldRender(true);
            
            // Dùng rAF để đảm bảo DOM đã render content trước khi kích hoạt transition
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsVisible(true);
              });
            });

            // Sau khi render thì bỏ observe, không unmount hay trigger lại
            if (sectionRef.current) {
              observer.unobserve(sectionRef.current);
            }
          }
        });
      },
      { rootMargin, threshold }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [rootMargin, threshold]);

  return (
    <div 
      ref={sectionRef} 
      className={`transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
      style={{ minHeight: shouldRender ? 'auto' : `${minHeight}px` }}
    >
      {shouldRender ? children : (
        // Skeleton block while waiting to render
        <div 
          className="w-full bg-slate-50 border border-slate-100 rounded-xl animate-pulse" 
          style={{ minHeight: `${minHeight}px` }} 
        />
      )}
    </div>
  );
}
