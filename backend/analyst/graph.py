"""
LangGraph ReAct graph for the conversational analyst.
The graph has three node types:
  - agent: calls the LLM with the current message history + tool schema
  - tools: executes the tool the LLM requested
  - end: returns the final response

The ExecutionGuard wraps every tool call at the tools node,
enforcing the allowlist and org_id scoping.
"""
from typing import Annotated, Any, TypedDict

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)


class AnalystState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


def build_graph(
    system_prompt: str,
    tools: list,
    model: str = "gpt-4o",
) -> Any:
    """
    Build and compile the ReAct LangGraph for a single analyst request.
    Returns a compiled graph ready for `.ainvoke()`.

    tools must already be pre-filtered by ExecutionGuard.
    """
    llm = ChatOpenAI(
        model=model,
        api_key=get_settings().openai_api_key,
        temperature=0,
    ).bind_tools(tools)

    tool_node = ToolNode(tools)

    def agent_node(state: AnalystState) -> AnalystState:
        messages = state["messages"]
        # Prepend system prompt on first call only (SystemMessage at index 0)
        if not messages or not isinstance(messages[0], SystemMessage):
            messages = [SystemMessage(content=system_prompt)] + messages

        response = llm.invoke(messages)
        return {"messages": [response]}

    def should_continue(state: AnalystState) -> str:
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    graph = StateGraph(AnalystState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)

    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    return graph.compile()
