/*
 * eXist Open Source Native XML Database
 * Copyright (C) 2001-2019 The eXist Project
 * http://exist-db.org
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

package org.exist.fore.util;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.util.ArrayList;
import java.util.List;

/**
 * The DOM Whitespace helper class provides a set of methods that might
 * be helpful in implementing adjustable whitespace and comment handling
 * in DOM processing applications.
 *
 * @author <a href="mailto:unl@users.sourceforge.net">Ulrich Nicolas Liss&eacute;</a>
 * @version $Id: DOMWhitespace.java 2276 2006-08-21 20:04:36Z unl $
 */
public class DOMWhitespace {
    // Utility methods.

    /**
     * Checks wether the given string consists of Unicode whitespace.
     *
     * @param string the string to be checked.
     * @return <CODE>true</CODE> if the given string consists of
     *         Unicode whitespace, otherwise <CODE>false</CODE>.
     */
    public static boolean isWhitespace(String string) {
        if (string != null) {
            for (int index = 0; index < string.length(); index++) {
                if (!Character.isWhitespace(string.charAt(index))) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Returns the index of the next item in the node list being not a
     * comment node.
     *
     * @param list  the node list.
     * @param start the start index.
     * @return the index of the next item in the node list being not a
     *         comment node.
     */
    public static int skipComments(NodeList list, int start) {
        for (int index = start; index < list.getLength(); index++) {
            if (list.item(index).getNodeType() != Node.COMMENT_NODE) {
                return index;
            }
        }

        return list.getLength();
    }

    /**
     * Returns the index of the next item in the node list being not a
     * whitespace text node.
     *
     * @param list  the node list.
     * @param start the start index.
     * @return the index of the next item in the node list being not a
     *         whitespace text node.
     */
    public static int skipWhitespace(NodeList list, int start) {
        for (int index = start; index < list.getLength(); index++) {
            if (list.item(index).getNodeType() != Node.TEXT_NODE) {
                return index;
            }

            if (!isWhitespace(list.item(index).getNodeValue())) {
                return index;
            }
        }

        return list.getLength();
    }

    /**
     * Returns the index of the next item in the node list being neither a
     * whitespace text node nor a comment node.
     *
     * @param list  the node list.
     * @param start the start index.
     * @return the index of the next item in the node list being neither a
     *         whitespace text node nor a comment node.
     */
    public static int skipWhitespaceAndComments(NodeList list, int start) {
        for (int index = start; index < list.getLength(); index++) {
            if (list.item(index) == null) {
                return index;
            }

            if ((list.item(index).getNodeType() != Node.COMMENT_NODE) &&
                    (list.item(index).getNodeType() != Node.TEXT_NODE)) {
                return index;
            }

            if ((list.item(index).getNodeType() == Node.TEXT_NODE) &&
                    !isWhitespace(list.item(index).getNodeValue())) {
                return index;
            }
        }

        return list.getLength();
    }

    /**
     * Splits the specified text into whitespace and text portions.
     * <p/>
     * Any leading or trailing whitespace characters as well as any
     * two or more adjacent whitespace characters within text are
     * separated.
     *
     * @param text the text to denormalize.
     * @return a list of whitespace and text portions.
     */
    public static List denormalizeText(String text) {
        if (text == null) {
            return null;
        }

        List list = new ArrayList();
        if (text.length() == 0) {
            list.add(text);
            return list;
        }

        int start = 0;
        boolean whitespace = Character.isWhitespace(text.charAt(start));

        for (int index = 0; index < text.length(); index++) {
            if (whitespace && (!Character.isWhitespace(text.charAt(index)))) {
                // add whitespace and switch mode
                list.add(text.substring(start, index));
                start = index;
                whitespace = false;
            }
            if (!whitespace && Character.isWhitespace(text.charAt(index))) {
                // look ahead to skip a single whitespace character within text
                if ((index + 1 < text.length() && Character.isWhitespace(text.charAt(index + 1))) ||
                        index + 1 == text.length()) {
                    // add text and switch mode
                    list.add(text.substring(start, index));
                    start = index;
                    whitespace = true;
                }
            }
        }

        list.add(text.substring(start, text.length()));
        return list;
    }

}
