/**
 * Gets the hierarchy of a topic
 * @param topic The topic name
 * @returns An array of topic names in the hierarchy
 */
export function getTopicHierarchy(topic: string): string[] {
  // Ensure the topic starts with a slash
  const normalizedTopic = topic.startsWith('/') ? topic : `/${topic}`;
  
  // Split the topic into parts
  const parts = normalizedTopic.split('/');
  
  // Build the hierarchy
  const hierarchy: string[] = ['/'];
  let current = '';
  
  for (let i = 1; i < parts.length; i++) {
    if (parts[i] === '') continue;
    current += `/${parts[i]}`;
    hierarchy.push(current);
  }
  
  return hierarchy;
}

/**
 * Gets the basename of a topic
 * @param topic The topic name
 * @returns The basename of the topic
 */
export function getTopicBasename(topic: string): string {
  // Split the topic into parts
  const parts = topic.split('/');
  
  // Find the last non-empty part
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] !== '') {
      return parts[i];
    }
  }
  
  return '';
}

/**
 * Checks if a topic matches a pattern
 * @param topic The topic name
 * @param pattern The pattern to match
 * @param prefixMatch Whether to match by prefix
 * @returns Whether the topic matches the pattern
 */
export function topicMatches(
  topic: string,
  pattern: string,
  prefixMatch: boolean = false
): boolean {
  // Normalize topics to start with a slash
  const normalizedTopic = topic.startsWith('/') ? topic : `/${topic}`;
  const normalizedPattern = pattern.startsWith('/') ? pattern : `/${pattern}`;
  
  if (prefixMatch) {
    // Check if the topic starts with the pattern
    return normalizedTopic.startsWith(normalizedPattern);
  } else {
    // Check for exact match
    return normalizedTopic === normalizedPattern;
  }
}
