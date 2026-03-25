// Landing Page Components
export * from './pages/landing/ExtensionCarousel';

// Mind Page Components
export { CustomContentTreemap } from './pages/mind/CustomContentTreemap';
export { ElementStatistics } from './pages/mind/ElementStatistics';
export { TreeVisualization } from './pages/mind/TreeVisualization';

// Error Display
export { NotFoundError, AuthRequiredError, ErrorDisplay, type ErrorDisplayProps } from './shared/ErrorDisplay'
export { type LoadingDisplayProps, LoadingDisplay, WebsiteLoadingDisplay, SnapshotLoadingDisplay, DashboardLoadingDisplay } from './shared/LoaderDisplay'
export { default as PageBackground } from './shared/PageBackground'

// Websites Page Components
export { default as AccessibilityChatbot } from './pages/websites/AccessibilityChatbot';
export { default as EnhancedAccessibilitySection } from './pages/websites/EnhancedAccessibilitySection';
export { default as InteractiveElements } from './pages/websites/InteractiveElements';
export { default as PerformanceCharts } from './pages/websites/PerformanceCharts';
export { default as SnapshotDiff } from './pages/websites/SnapshotDiff';
export { default as SnapshotList } from './pages/websites/SnapshotList';
export { default as SnapshotDisplay } from './pages/websites/SnapshotPreview';

// Re-export any existing exports from the websites index file
//export * from './pages/websites';