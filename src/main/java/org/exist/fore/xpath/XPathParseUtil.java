/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.xpath;

import java.util.ArrayList;

/**
 * Provides XPath parsing utility functions tailored to BetterForm's needs.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: XPathUtil.java 2269 2006-08-18 21:01:25Z unl $
 */
public class XPathParseUtil {

    /**
     * Start of an instance() function expression.
     */
    public static final String INSTANCE_FUNCTION = "instance(";

    /**
     * XPath for outermost context.
     */
    public static final String OUTERMOST_CONTEXT = "/*[1]";

    /**
     * Extracts the first part of the specified path expression.
     * <p/>
     * Examples:
     * <ul>
     * <li><code>"a"</code> returns <code>"a"</code>.
     * <li><code>"/a"</code> returns <code>"a"</code>.
     * <li><code>"/a/b"</code> returns <code>"a"</code>.
     * <li><code>"instance('i')/a"</code> returns <code>"instance('i')"</code>.
     * </ul>
     *
     * @param path the path expression.
     * @return the first part of the specified path expression.
     */
    public static String getFirstPart(String path) {
        if (path == null) {
            return null;
        }
        if (path.length() == 0) {
            return path;
        }

        String[] expressions = XPathParseUtil.splitPathExpr(path, 2);
        return path.charAt(0) == '/' ? expressions[1] : expressions[0];
    }

    /**
     * Splits the specified path expression into a nodeset part and all
     * predicates of the last step of the path expression.
     * <p/>
     * Examples:
     * <ul>
     * <li><code>"/a/b"</code> returns <code>{"/a/b"}</code>.
     * <li><code>"/a/b[p]"</code> returns <code>{"/a/b", "p"}</code>.
     * <li><code>"/a/b[p][q]"</code> returns <code>{"/a/b", "p", "q"}</code>.
     * <li><code>"/a[1]/b[2]/c[3]"</code> returns <code>{"/a[1]/b[2]/c", "3"}</code>.
     * </ul>
     *
     * @param path the path expression.
     * @return the path expression splitted into nodeset and predicate parts.
     */
    public static String[] getNodesetAndPredicates(String path) {
        if (path == null) {
            return null;
        }
        if (path.length() == 0) {
            return new String[]{path};
        }

        String[] expressions = XPathParseUtil.splitPathExpr(path);
        String[] parts = XPathParseUtil.splitStep(expressions[expressions.length - 1]);

        expressions[expressions.length - 1] = parts[0];
        parts[0] = XPathParseUtil.joinPathExpr(expressions);

        return parts;
    }

    /**
     * Checks wether the specified path expression starts with the
     * <code>instance</code> function.
     * <p/>
     * Examples:
     * <ul>
     * <li><code>"a"</code> returns <code>false</code>.
     * <li><code>"a[.=instance('i')/b]"</code> returns <code>false</code>.
     * <li><code>"instance('i')/a"</code> returns <code>true</code>.
     * <li><code>"instance(/b/c)/a"</code> returns <code>true</code>.
     * </ul>
     *
     * @param path the path expression.
     * @return <code>true</code> if the specified path expression starts with
     * the <code>instance</code> function, <code>false</code> otherwise.
     */
    public static boolean hasInstanceFunction(String path) {
        return path != null && path.startsWith(INSTANCE_FUNCTION);
    }

    /**
     * Extracts the parameter expression of the <code>instance</code> function
     * in case the the specified path expression starts with the
     * <code>instance</code> function.
     * <p/>
     * Examples:
     * <ul>
     * <li><code>"a"</code> returns <code>null</code>.
     * <li><code>"a[.=instance('i')/b]"</code> returns <code>null</code>.
     * <li><code>"instance('i')/a"</code> returns <code>"'i'"</code>.
     * <li><code>"instance(/b/c)/a"</code> returns <code>"/b/c"</code>.
     * </ul>
     *
     * @param path the path expression.
     * @return the parameter expression of the <code>instance</code> function.
     */
    public static String getInstanceParameter(String path) {
        if (XPathParseUtil.hasInstanceFunction(path)) {
            String instance = XPathParseUtil.splitPathExpr(path, 1)[0];
            return instance.substring(INSTANCE_FUNCTION.length()+1, instance.lastIndexOf(')') -1);
        }

        return null;
    }

    /**
     * Checks wether the specified path expression is an absolute path.
     *
     * @param path the path expression.
     * @return <code>true</code> if specified path expression is an absolute
     * path, otherwise <code>false</code>.
     */
    public static boolean isAbsolutePath(String path) {
        return path != null && (path.startsWith("/") || path.startsWith(INSTANCE_FUNCTION));
    }

    /**
     * Checks wether the specified path expression is a dot reference.
     *
     * @param path the path expression.
     * @return <code>true</code> if specified path expression is a dot
     * reference, otherwise <code>false</code>.
     */
    public static boolean isDotReference(String path) {
        return path != null && path.equals(".");
    }

    /**
     * Checks wether the specified path expression is a self reference and
     * strips the self referencing expression portion.
     *
     * @param path the path expression.
     * @return the stripped path expression if the specified path path is
     * a self reference, otherwise the unmodified path expression.
     */
    public static String stripSelfReference(String path) {
        if (path != null && path.startsWith("./")) {
            // strip self reference
            return path.substring(2);
        }

        // leave unmodified
        return path;
    }

    // generic helper

    /**
     * Splits the specified path expression into step-wise parts. Leading
     * slashes result in empty parts while trailing slashes are igonred.
     * <p/>
     * Examples:
     * <ul>
     * <li><code>"a/b/c"</code> returns <code>{"a", "b", "c"}</code>.
     * <li><code>"/a/b/c"</code> returns <code>{"", "a", "b", "c"}</code>.
     * <li><code>"/a/b/c/"</code> returns <code>{"", "a", "b", "c"}</code>.
     * <li><code>"//a/b/c"</code> returns <code>{"", "", "a", "b", "c"}</code>.
     * <li><code>"//a/b/c/"</code> returns <code>{"", "", "a", "b", "c"}</code>.
     * <li><code>"a/n:b/c[d/e]"</code> returns <code>{"a", "n:b", "c[d/e]"}</code>.
     * </ul>
     *
     * @param path the path expression.
     * @return the specified path expression in step-wise parts.
     */
    public static String[] splitPathExpr(String path) {
        return XPathParseUtil.splitPathExpr(path, 0);
    }

    /**
     * Splits the specified path expression into step-wise parts. Leading
     * slashes result in empty parts while trailing slashes are igonred.
     * <p/>
     * Additionally the desired count of parts to be returned may be specified.
     * Any number less than 1 or greater than the actual number of parts is
     * meaningless and returns all found parts.
     * <p/>
     * Examples:
     * <ul>
     * <li><code>"a/b/c", 0</code> returns <code>{"a", "b", "c"}</code>.
     * <li><code>"a/b/c", 2</code> returns <code>{"a", "b"}</code>.
     * <li><code>"/a/b/c", 4</code> returns <code>{"a", "b", "c"}</code>.
     * </ul>
     *
     * @param path the path expression.
     * @param count the desired number of parts.
     * @return the specified path expression in step-wise parts.
     */
    public static String[] splitPathExpr(String path, int count) {
        if (path == null) {
            return null;
        }

        int offset = 0;
        int braces = 0;
        ArrayList list = new ArrayList();
        for (int index = 0; index < path.length() && (count < 1 || count > list.size()); index++) {
            switch (path.charAt(index)) {
                case '[':
                    // fall through
                case '(':
                    braces++;
                    break;
                case ']':
                    // fall through
                case ')':
                    braces--;
                    break;
                case '/':
                    if (braces == 0) {
                        list.add(path.substring(offset, index));
                        offset = index + 1;
                    }
                    break;
            }
        }

        if (offset < path.length() && (count < 1 || count > list.size())) {
            list.add(path.substring(offset, path.length()));
        }

        return (String[]) list.toArray(new String[0]);
    }

    /**
     * Joins step-wise parts to a path expression. The parts are simply
     * concatenated with in-between slashes.
     * <p/>
     * Examples:
     * <ul>
     * <li><code>{"a", "b", "c"}</code> returns <code>"a/b/c"</code>.
     * <li><code>{"", "a", "b", "c"}</code> returns <code>"/a/b/c"</code>.
     * <li><code>{"", "a", "b", "c", ""}</code> returns <code>"/a/b/c/"</code>.
     * <li><code>{"", "", "a", "b", "c"}</code> returns <code>"//a/b/c"</code>.
     * <li><code>{"", "", "a", "b", "c", ""}</code> returns <code>"//a/b/c/"</code>.
     * <li><code>{"a", "n:b", "c[d/e]"}</code> returns <code>"a/n:b/c[d/e]"</code>.
     * </ul>
     *
     * @param parts the step-wise parts.
     * @return the path expression.
     */
    public static String joinPathExpr(String[] parts) {
        return XPathParseUtil.joinPathExpr(parts, 0, parts != null ? parts.length : -1);
    }

    /**
     * Joins step-wise parts to a path expression. The parts are simply
     * concatenated with in-between slashes.
     * <p/>
     * Additionally the desired start and end indices may be specified.
     * <p/>
     * Examples:
     * <ul>
     * <li><code>{"a", "b", "c"}, 0, 3</code> returns <code>"a/b/c"</code>.
     * <li><code>{"a", "b", "c"}, 1, 2</code> returns <code>"b"</code>.
     * </ul>
     *
     * @param parts the step-wise parts.
     * @param start the start index.
     * @param end the end index.
     * @return the path expression.
     */
    public static String joinPathExpr(String[] parts, int start, int end) {
        if (parts == null || start > end) {
            return null;
        }

        StringBuffer buffer = new StringBuffer();
        for (int index = start; index < end; index++) {
            if (index > start) {
                buffer.append('/');
            }
            buffer.append(parts[index]);
        }

        return buffer.toString();
    }

    /**
     * Splits the specified step into parts.
     * <p/>
     * Examples:
     * <ul>
     * <li><code>"a"</code> returns <code>{"a"}</code>.
     * <li><code>"a[p]"</code> returns <code>{"a", "p"}</code>.
     * <li><code>"a[p][q]"</code> returns <code>{"a", "p", "q"}</code>.
     * <li><code>"child::a[p][q]"</code> returns <code>{"child::a", "p", "q"}</code>.
     * <li><code>"a[b[p]][c/d[q]]"</code> returns <code>{"a", "b[p]", "c/d[q]"}</code>.
     * </ul>
     *
     * @param step the step.
     * @return the specified step in parts.
     */
    public static String[] splitStep(String step) {
        if (step == null) {
            return null;
        }

        int offset = 0;
        int braces = 0;
        ArrayList list = new ArrayList();
        for (int index = 0; index < step.length(); index++) {
            switch (step.charAt(index)) {
                case '[':
                    if (braces == 0) {
                        if (offset == 0) {
                            list.add(step.substring(offset, index));
                        }
                        offset = index + 1;
                    }
                    braces++;
                    break;
                case ']':
                    if (braces == 1) {
                        list.add(step.substring(offset, index));
                        offset = index + 1;
                    }
                    braces--;
                    break;
            }
        }

        if (offset < step.length()) {
            list.add(step.substring(offset, step.length()));
        }

        return (String[]) list.toArray(new String[0]);
    }

    /**
     * Joins parts to a complete step. The first part will be treated as a node
     * test, an axis or a combination of both, and all following parts will be
     * treated as predictes.
     * <p/>
     * Examples:
     * <ul>
     * <li><code>{"a"}</code> returns <code>"a"</code>.
     * <li><code>{"a", "p"}</code> returns <code>"a[p]"</code>.
     * <li><code>{"a", "p", "q"}</code> returns <code>"a[p][q]"</code>.
     * <li><code>{"child::a", "p", "q"}</code> returns <code>"child::a[p][q]"</code>.
     * <li><code>{"a", "b[p]", "c/d[q]"}</code> returns <code>"a[b[p]][c/d[q]]"</code>.
     * </ul>
     *
     * @param parts the parts.
     * @return the step.
     */
    public static String joinStep(String[] parts) {
        if (parts == null) {
            return null;
        }

        StringBuffer buffer = new StringBuffer();
        for (int index = 0; index < parts.length; index++) {
            if (index > 0) {
                buffer.append('[');
            }
            buffer.append(parts[index]);
            if (index > 0) {
                buffer.append(']');
            }
        }

        return buffer.toString();
    }

}
